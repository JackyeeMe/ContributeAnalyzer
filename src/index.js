import analyze from "./analyze.js";
import projects, {defBackBrch, defFrontBrch, frontGroup, backGroup, log_verbose} from "./config.js";
import { promisify } from "util";
import { queryLastCommitOfDay } from "./gitlab.js";
import areas from './month.js';

const queryCommit = promisify(queryLastCommitOfDay);

async function calcMonthEndCommit(time, project, projectName, brch, author) {
    
    const commits = await queryCommit(project.id, brch, time.sinceTime, time.untilTime, author, log_verbose);
    
    // resolve commits with: { error: 'since is invalid, until is invalid' }
    if (log_verbose)
        console.log(`commits: `, commits);
    
    if (commits == null || (Array.isArray(commits) && commits.length === 0) || commits.error) {

        if (log_verbose)
            console.log(`[Warning]: ${projectName} ${time.month} commit query result: `, commits.error == undefined ? 'no commit' : commits.error);
        
        return {
            projectName: projectName,
            brch: 'no commit',
            month: time.month,
            author: author,
            fileCount: 0,
            codeLines: 0,
            codeCnt: 0,
            commentCnt: 0,
            blankCnt: 0
        }
    }
    
    const endCommit = commits[0];
    const endRes = await analyze(project, endCommit.id, projectName);

    if (log_verbose)
        console.log(`${projectName} ${time.month} commit id: `, endCommit.id);

    return {
        projectName: projectName,
        brch: endCommit.id,
        month: time.month,
        author: author,
        fileCount: endRes[0],
        codeLines: endRes[1],
        codeCnt: endRes[2],
        commentCnt: endRes[3],
        blankCnt: endRes[4]
    };
}

async function getInfo(project, projectName) {
    
    let arr = [];
    let author = '';
    let brch = defBackBrch;
    if (projectName.startsWith('front_')) { // front project ?
        brch = defFrontBrch;
    }

    for (let index = 0; index < areas.length; index++) { // loop month
        
        const item = areas[index]; // time range object
        const res = await calcMonthEndCommit(item, project, projectName, brch, author);
        
        arr = [...arr, res];
        const len = arr.length;
        
        if (len == 1) {
            arr[0].addLines = 0;
            // arr[0].addCount = 0;
            // arr[0].addCode = 0;
        }

        if(len > 1) {
            const cur = arr[len - 1]; // cur month
            const pre = arr[len - 2]; // previoud month

            cur.addLines = 0;
            // cur.addCount = 0;
            // cur.addCode = 0;
            
            if (cur.fileCount == 0) {
                // cur month with no commit, fill with the recent commit
                for (let i = len - 2; i >= 0; i--) {
                    if (arr[i].projectName === cur.projectName && arr[i].author === cur.author && arr[i].fileCount > 0) {
                        cur.fileCount = arr[i].fileCount;
                        cur.codeLines = arr[i].codeLines;
                        cur.codeCnt = arr[i].codeCnt;
                        cur.commentCnt = arr[i].commentCnt;
                        cur.blankCnt = arr[i].blankCnt;
                        cur.addLines = 0;
                        break;
                    }
                }
                continue;
            }

            // foreach until the recent commit found
            if (pre.fileCount == 0) {
                if (len == 2) {
                    cur.addLines = cur.codeLines; // all code submit in cur month
                    continue;
                }

                for (let i = len - 3; i >= 0; i--) {
                    if (arr[i].projectName === cur.projectName && arr[i].author === cur.author && arr[i].fileCount > 0) {
                        cur.addLines = cur.codeLines - arr[i].codeLines;
                        // cur.addCount = cur.fileCount - arr[i].fileCount;
                        // cur.addCode = cur.codeCnt - arr[i].codeCnt;
                        break;
                    }
                }
            } else {
                cur.addLines = cur.codeLines - pre.codeLines;
                // cur.addCount = cur.fileCount - pre.fileCount;
                // cur.addCode = cur.codeCnt - pre.codeCnt;
            }
        }
    }
    return arr;
}

async function getInfoByUsers(project, projectName, brch, authors) {
    
    let arr = [];
    
    for (let uid = 0; uid < authors.length; uid++) {
        const author = authors[uid]; // per-author

        for (let index = 0; index < areas.length; index++) {
            const item = areas[index]; // per-month
        
            const res = await calcMonthEndCommit(item, project, projectName, brch, author); // last commit
            
            arr = [...arr, res];
            const len = arr.length;
            
            if (len == 1) { // first month, do not diff it
                arr[0].addLines = 0;
                // arr[0].addCount = 0;
                // arr[0].addCode = 0;
            } 
            
            if(len > 1) {
                const cur = arr[len - 1]; // cur month
                const pre = arr[len - 2]; // prev month

                cur.addLines = 0;
                // cur.addCount = 0;
                // cur.addCode = 0;
                
                if (cur.fileCount == 0) {
                    // cur month with no commit, fill with the recent commit
                    for (let i = len - 2; i >= 0; i--) {
                        if (arr[i].projectName === cur.projectName && arr[i].author === cur.author && arr[i].fileCount > 0) {
                            cur.fileCount = arr[i].fileCount;
                            cur.codeLines = arr[i].codeLines;
                            cur.codeCnt = arr[i].codeCnt;
                            cur.commentCnt = arr[i].commentCnt;
                            cur.blankCnt = arr[i].blankCnt;
                            cur.addLines = 0;
                            break;
                        }
                    }
                    continue;
                }

                // foreach until the recent commit found
                if (pre.fileCount == 0) {
                    if (len == 2) {
                        cur.addLines = cur.codeLines; // all code submit in cur month
                        continue;
                    }

                    for (let i = len - 3; i >= 0; i--) {
                        if (arr[i].projectName === cur.projectName && arr[i].author === cur.author && arr[i].fileCount > 0) {
                            cur.addLines = cur.codeLines - arr[i].codeLines;
                            // cur.addCount = cur.fileCount - arr[i].fileCount;
                            // cur.addCode = cur.codeCnt - arr[i].codeCnt;
                            break;
                        }
                    }
                } else {
                    cur.addLines = cur.codeLines - pre.codeLines;
                    // cur.addCount = cur.fileCount - pre.fileCount;
                    // cur.addCode = cur.codeCnt - pre.codeCnt;
                }
            }
        }
    }

    return arr;
}

async function getProject() {
    let res = [];
    for (let project in projects) {
        const pro = await getInfo(projects[project], project);
        
        // FIXME: sleep 1s for each project to avoid scc tool busy to incorrect count with the huge amount
        await new Promise(resolve => setTimeout(resolve, 1000));

        pro.slice(0, pro.length).forEach(item => res.push(item));
    }
    console.log(JSON.stringify(res, null, 2));
}

async function getPerson() {
    let res = [];
    let brch = defBackBrch;
    let authors = backGroup;

    for (let project in projects) {
        
        if (project.startsWith('front_')) { // front project ?
            brch = defFrontBrch;
            authors = frontGroup;
        }
        const pro = await getInfoByUsers(projects[project], project, brch, authors);

        // FIXME: sleep 1s for each project to avoid scc tool busy to incorrect count with the huge amount
        await new Promise(resolve => setTimeout(resolve, 1000));
        pro.slice(0, pro.length).forEach(item => res.push(item));
    }
    // print
    console.log(JSON.stringify(res, null, 2));
}

// getProject();
getPerson();