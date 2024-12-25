import { exec as _exec } from "child_process";
import { promisify } from 'util';
import {defBackBrch, defFrontBrch, log_verbose} from "./config.js";

const exec = promisify(_exec)

export async function prepare(project, projectName) {
    if (projectName.startsWith('front_')) {
        await exec([`cd ${project.path}`, `git checkout -f ${defFrontBrch}`, `git pull origin ${defFrontBrch}`].join('&&'));
    } else {
        await exec([`cd ${project.path}`, `git checkout -f ${defBackBrch}`, `git pull origin ${defBackBrch}`].join('&&'));
    }
}

export async function delBrchIfExist(workDir, brch, callback) {
    let {stdout} = await exec([`cd ${workDir}`, `git branch --list ${brch}`].join('&&'));
    if (stdout !== '') { // brch exist
        let {stdout} = await exec([`cd ${workDir}`, `git branch -D ${brch}`].join('&&'));
    }
    
    // no matter whether exist, always successfully callback, swallow all error
    callback(null, true);
    
}

export async function checkout(project, brch) {
    delBrchIfExist(project.path, brch, (error, result) => {
        
        if (error && log_verbose)
            console.log(error);
        
        if (result)
            return exec([`cd ${project.path}`, `git checkout -f ${brch} -b ${brch}`, `git pull origin ${brch}`].join('&&'));
    });
}

export default async function analyze(project, commit, projectName) {
    await prepare(project, projectName);
    await checkout(project, commit);
    const {stdout} = await exec([`cd ${project.path}`, `docker run --rm -v "$PWD:/pwd" ghcr.io/lhoupert/scc:master scc -f json -x json,.gitignore /pwd`].join('&&'))
    const result = JSON.parse(stdout)
    const res = result.reduce((pre, cur) => {
        return [pre[0] + cur.Count, pre[1] + cur.Lines, pre[2] + cur.Code, pre[3] + cur.Comment, pre[4] + cur.Blank]
    }, [0, 0, 0, 0, 0])
    return res
}

// result example
//  {
//     Name: 'JavaScript',
//     Bytes: 32364209,
//     CodeBytes: 0,
//     Lines: 858955,           total lines
//     Code: 748857,            code lines
//     Comment: 47206,          comment lines
//     Blank: 62892,            blank lines
//     Complexity: 74653,
//     Count: 4744,             file count
//     WeightedComplexity: 0,
//     Files: []
//   },