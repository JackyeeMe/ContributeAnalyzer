// import https from "https";
import http from "http";

const GITLAB_TOKEN = 'fill in your gitlab ';
const GITLAB_HOST = 'fill in your gitlab host';

function isNotEmpty(str) {
    return str !== null && str !== undefined && str !== '';
}

export function queryLastCommitOfDay(projectId, brch, since, until, author, logVerbose, cb) {
    
    let result = ''
    if (logVerbose)
        console.log(`since: `, since, `, until: `, until)
    
    let uri = `/api/v4/projects/${projectId}/repository/commits?since=${since}&until=${until}&per_page=100`
    
    if (isNotEmpty(author))
        uri += `&author=${encodeURIComponent(author)}`

    if (isNotEmpty(brch))
        uri += `&ref_name=${encodeURIComponent(brch)}`

    http.get({
        headers: {
            "PRIVATE-TOKEN": JENKINS_TOKEN
        },
        host: GITLAB_HOST,
        path: uri,
    },(res)=>{
        res.on('data',data=>{
            result += data.toString()
        })
        res.on('end',(res)=>{
            const commits = JSON.parse(result)
            cb(null,commits)
        })
    }).on('error',err => {
        console.log(err)
        cb(err,null)
    })
}