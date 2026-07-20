"use strict";
const fs=require("fs");
const path=require("path");
const Intent=require("./intent-engine-en.js");
const Diagnostic=require("./execution-diagnostics-en.js");
const root=__dirname;
const intents=JSON.parse(fs.readFileSync(path.join(root,"intents-en.json"),"utf8"));
const knowledge=JSON.parse(fs.readFileSync(path.join(root,"knowledge-en.json"),"utf8"));
const diagnostics=JSON.parse(fs.readFileSync(path.join(root,"diagnostic-patterns-en.json"),"utf8"));
const intentEngine=new Intent(intents,knowledge.entities);
const diagnosticEngine=new Diagnostic(diagnostics);
const intentCases=[
 ["install nginx","install_nginx"],
 ["install a package","install_package"],
 ["service failed","service_failed"],
 ["open port 8080 tcp","open_port"],
 ["ssh is not working","ssh_failed"],
 ["disk is full","disk_full"],
 ["permission denied","permission_denied"],
 ["what is selinux","explain_concept"],
 ["rhel beginner path","learning_path"]
];
const failures=[];
for(const [query,expected] of intentCases){
 const result=intentEngine.analyze(query);
 const actual=result.intent?.id||null;
 if(actual!==expected)failures.push(`Intent ${query}: expected ${expected}, got ${actual}`);
}
const diagCases=[
 ["nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)","address-in-use"],
 ["Job for nginx.service failed because the control process exited with error code.","service-failed"],
 ["curl: (6) Could not resolve host: example.internal","dns-resolution"],
 ["HTTP/1.1 200 OK","http-ok"]
];
for(const [output,expected] of diagCases){
 const result=diagnosticEngine.analyze({output,command:expected==="http-ok"?"curl -I http://localhost":"sudo systemctl restart nginx",task:{},step:{},variables:{SERVICE:"nginx",PORT:"80"}});
 if(result.id!==expected)failures.push(`Diagnostic expected ${expected}, got ${result.id}`);
}
const arabic=/[\u0600-\u06FF]/;
for(const file of ["knowledge-en.json","intents-en.json","doctor-data-en.json","diagnostic-patterns-en.json"]){
 const text=fs.readFileSync(path.join(root,file),"utf8");
 if(arabic.test(text))failures.push(`${file} still contains Arabic text`);
}
const report=[
 "BILINGUAL ENGLISH INTERFACE TEST REPORT",
 "=======================================",
 `English entities: ${knowledge.entities.length}`,
 `English intents tested: ${intentCases.length}`,
 `English diagnostics tested: ${diagCases.length}`,
 `Failures: ${failures.length}`,
 "",
 failures.length?failures.map(x=>`- ${x}`).join("\n"):"All English interface data and engine tests passed."
].join("\n");
fs.writeFileSync(path.join(root,"BILINGUAL_TEST_REPORT.txt"),report,"utf8");
console.log(report);
if(failures.length)process.exit(1);
