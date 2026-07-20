"use strict";

class ExecutionDiagnosticEngine {
  constructor(data) {
    this.data = data || { rules: [], success_patterns: [], fallbacks: {} };
    this.rules = (this.data.rules || []).map(rule => ({
      ...rule,
      _patterns: (rule.patterns || []).map(pattern => this.compile(pattern)),
      _negative: (rule.negative_patterns || []).map(pattern => this.compile(pattern))
    }));
    this.successPatterns = (this.data.success_patterns || []).map(item => ({
      ...item,
      _pattern: this.compile(item.pattern)
    }));
  }

  compile(pattern) {
    try { return new RegExp(pattern, "imu"); }
    catch (error) {
      console.warn("Invalid diagnostic regex:", pattern, error);
      return /$a/;
    }
  }

  cleanOutput(value) {
    return String(value || "")
      .replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, "")
      .replace(/\r/g, "")
      .trim();
  }

  analyze({ output, command = "", task = {}, step = {}, variables = {}, sourceTitle = "" }) {
    const clean = this.cleanOutput(output);
    const context = this.buildContext(command, task, step, sourceTitle);
    const extractedVariables = this.extractVariables(command, clean, variables);

    if (!clean) {
      return {
        status: "empty", confidence: 0, id: "empty-output",
        title_ar: "No output lthlylha",
        explanation_ar: "bad awamr Linux tnjh without Print shy. akd alnjah alsamt or nfdh Check Verification.",
        evidence: [], likely_causes_ar: [],
        checks: this.fallbackChecks(context.domains, extractedVariables),
        fixes_ar: [], verification: [], alternatives: [],
        domains: [...context.domains], extracted_variables: extractedVariables
      };
    }

    const specific = this.commandSpecific(command, clean, sourceTitle, extractedVariables);
    if (specific) {
      return { ...specific, domains: [...context.domains], extracted_variables: extractedVariables };
    }

    const candidates = [];
    for (const rule of this.rules) {
      if (rule._negative.some(regex => regex.test(clean))) continue;

      const matched = [];
      for (const regex of rule._patterns) {
        const match = regex.exec(clean);
        if (match) matched.push({ text: match[0], index: match.index, pattern: regex.source });
      }
      if (!matched.length) continue;

      const domainOverlap = (rule.domains || []).filter(domain => context.domains.has(domain)).length;
      let score = Number(rule.base_confidence || 0.7) * 100;
      score += Math.min(12, (matched.length - 1) * 3);
      score += Math.min(18, domainOverlap * 6);
      if (rule.id === "generic-error") score = Math.min(score, 68);

      candidates.push({ rule, matched, score: Math.min(99, Math.round(score)) });
    }

    candidates.sort((a, b) => b.score - a.score);

    if (candidates.length) {
      const best = candidates[0];
      const result = this.ruleResult(best, clean, extractedVariables);
      result.alternatives = candidates.slice(1, 4).map(item => ({
        id: item.rule.id,
        title_ar: item.rule.title_ar,
        confidence: item.score,
        explanation_ar: item.rule.explanation_ar
      }));
      result.domains = [...context.domains];
      result.extracted_variables = extractedVariables;
      return result;
    }

    const success = this.detectSuccess(clean);
    if (success) {
      return {
        status: "success", confidence: 90, id: success.id,
        title_ar: "result tbdw najha",
        explanation_ar: success.summary_ar,
        evidence: this.evidence(clean, success.match),
        likely_causes_ar: [], checks: [], fixes_ar: [],
        verification: this.contextVerification(context, extractedVariables),
        alternatives: [], domains: [...context.domains],
        extracted_variables: extractedVariables
      };
    }

    return {
      status: "unknown", confidence: 35, id: "unknown-output",
      title_ar: "not yDone altarf on cause mhdd",
      explanation_ar: "output not ttabq nmta marwfa bdrja kafya. nfdh ahd checks altalya walsq ntyjth.",
      evidence: this.firstUsefulLines(clean, 4),
      likely_causes_ar: ["output mkhtsra", "cause mwjwd in log akhr", "alnatj malwmaty wlys rsala njah or fshl"],
      checks: this.fallbackChecks(context.domains, extractedVariables),
      fixes_ar: ["not ttbq Changea ashwayya before zhwr cause wadh.", "alsq output complete with alstwr alsabqa llkhta."],
      verification: [], alternatives: [], domains: [...context.domains],
      extracted_variables: extractedVariables
    };
  }

  ruleResult(candidate, clean, variables) {
    const rule = candidate.rule;
    return {
      status: "issue", confidence: candidate.score, id: rule.id,
      title_ar: rule.title_ar, severity: rule.severity || "medium",
      explanation_ar: rule.explanation_ar,
      evidence: this.evidence(clean, candidate.matched[0]),
      likely_causes_ar: rule.likely_causes_ar || [],
      checks: this.resolveItems(rule.checks || [], variables),
      fixes_ar: (rule.fixes_ar || []).map(item => this.resolve(item, variables)),
      verification: this.resolveItems(rule.verification || [], variables),
      alternatives: []
    };
  }

  detectSuccess(clean) {
    for (const item of this.successPatterns) {
      const match = item._pattern.exec(clean);
      if (match) return {
        id: item.id, summary_ar: item.summary_ar,
        match: { text: match[0], index: match.index }
      };
    }
    return null;
  }

  commandSpecific(command, output, sourceTitle, variables) {
    const cmd = String(command || "").toLowerCase();
    const text = output.toLowerCase();
    const source = String(sourceTitle || "").toLowerCase();

    if (/systemctl\s+is-active/.test(cmd)) {
      if (/^\s*active\s*$/m.test(text)) return this.simpleSuccess(
        "service-active", "service Active", "akd systemctl an service taml.", output
      );
      if (/^\s*(inactive|failed|activating|deactivating|unknown)\s*$/m.test(text)) {
        return this.simpleIssue(
          "service-not-active", "service lyst in status Active",
          `status current: ${output.trim()}.`,
          [
            { title_ar:"status altfsylya", command:"systemctl status <SERVICE> --no-pager -l", expected_result_ar:"cause status" },
            { title_ar:"Service log", command:"journalctl -u <SERVICE> -b --no-pager -n 120", expected_result_ar:"error alasly" }
          ], variables, output
        );
      }
    }

    if (/firewall-cmd.*--query-(?:port|service)/.test(cmd)) {
      if (/^\s*yes\s*$/m.test(text)) return this.simpleSuccess(
        "firewall-rule-present", "qaCounta firewall mwjwda", "firewalld aaad yes.", output
      );
      if (/^\s*no\s*$/m.test(text)) return this.simpleIssue(
        "firewall-rule-missing", "qaCounta firewall not mwjwda",
        "firewalld aaad no, wldhlk alPort or service not msmwhyn in zone.",
        [{ title_ar:"Show zone", command:"firewall-cmd --zone=<ZONE> --list-all", expected_result_ar:"services walmnafdh current" }],
        variables, output
      );
    }

    if (/(?:nginx\s+-t|apachectl\s+configtest|httpd\s+-t)/.test(cmd) &&
        /syntax is ok|syntax ok|test is successful/.test(text)) {
      return this.simpleSuccess("config-test-ok", "configuration file slym", "Test syntax njh.", output);
    }

    if (/\bcurl\b/.test(cmd)) {
      const codeMatch = text.match(/http\/\d(?:\.\d)?\s+(\d{3})/);
      if (codeMatch) {
        const code = Number(codeMatch[1]);
        if (code >= 200 && code < 400) return this.simpleSuccess(
          "http-ok", `astjaba HTTP ${code}`, "server aaad astjaba najha or re redirection.", output
        );
      }
    }

    if (/\bping\b/.test(cmd)) {
      if (/0% packet loss/.test(text)) return this.simpleSuccess(
        "ping-ok", "access alshbky najh", "not yfqd ping any packages.", output
      );
      const loss = text.match(/(\d+)% packet loss/);
      if (loss && Number(loss[1]) === 100) return this.simpleIssue(
        "ping-total-loss", "fqd complete lhzm Ping",
        "not ysl any rd. qd ykwn ICMP mhjwba or twjd problem wswl.",
        [
          { title_ar:"Show Path", command:"ip route get <HOST>", expected_result_ar:"interface walbwaba" },
          { title_ar:"Test alPort", command:"nc -vz -w 5 <HOST> <PORT>", expected_result_ar:"njah or cause alfshl" }
        ], variables, output
      );
    }

    if (/\bdf\s+-h|\bdf\s+-i/.test(cmd)) {
      const high = output.split("\n").find(line => /\b(?:9[5-9]|100)%\b/.test(line));
      if (high) return this.simpleIssue(
        "filesystem-near-full", "astkhdam file system hrj",
        `azhr alCheck nsba mrtfaa: ${high.trim()}`,
        [
          { title_ar:"akbr directories", command:"sudo du -xhd1 <PATH> | sort -h", expected_result_ar:"alaala asthlaka" },
          { title_ar:"files mhdhwfa mftwha", command:"sudo lsof +L1", expected_result_ar:"processes thtfz bmsaha" }
        ], variables, high
      );
    }

    if (/\bss\b|\bnetstat\b/.test(cmd) && /listen/i.test(output) &&
        /من يستخدم|تعارض|المستمع|المنفذ/.test(source)) {
      return this.simpleIssue(
        "listener-confirmed", "Done Find process tsDonea on alPort",
        "result alCheck akdt wjwd Listener. raja process wPID lIdentify hl hy almqswda am taarda.",
        [], variables, output
      );
    }

    if (/(?:^|\s)(?:getent\s+hosts|dig|host)\s/.test(cmd) && output.trim()) {
      return this.simpleSuccess("dns-ok", "solution name najh", "zhr address llwjha.", output);
    }

    if (/\brpm\s+-q\b/.test(cmd)) {
      if (/is not installed/.test(text)) return this.simpleIssue(
        "package-not-installed", "package not mthbta",
        "RPM akd an package not mwjwda.",
        [{ title_ar:"Search an package", command:"dnf info <PACKAGE>", expected_result_ar:"twfr package" }],
        variables, output
      );
      if (output.trim() && !/error|not installed/i.test(output)) return this.simpleSuccess(
        "package-installed", "package mthbta", "RPM aaad Package name wisdarha.", output
      );
    }
    return null;
  }

  simpleSuccess(id, title, explanation, evidenceText) {
    return {
      status:"success", confidence:96, id, title_ar:title,
      explanation_ar:explanation, evidence:this.firstUsefulLines(evidenceText,4),
      likely_causes_ar:[], checks:[], fixes_ar:[], verification:[], alternatives:[]
    };
  }

  simpleIssue(id, title, explanation, checks, variables, evidenceText) {
    return {
      status:"issue", confidence:95, id, title_ar:title, severity:"high",
      explanation_ar:explanation, evidence:this.firstUsefulLines(evidenceText,5),
      likely_causes_ar:[], checks:this.resolveItems(checks,variables),
      fixes_ar:[], verification:[], alternatives:[]
    };
  }

  buildContext(command, task, step, sourceTitle) {
    const text = [command, task.category, task.entity_type, task.title_ar,
      task.goal_ar, step.title_ar, step.explanation_ar, sourceTitle]
      .join(" ").toLowerCase();

    const domains = new Set(["global"]);
    const add = (...items) => items.forEach(item => domains.add(item));

    if (/systemctl|journalctl|\.service|service\b/.test(text)) add("service","systemd");
    if (/dnf|yum|rpm|package|حزم|تثبيت/.test(text)) add("packages","repository");
    if (/ssh|sshd|scp|sftp/.test(text)) add("ssh","network","authentication");
    if (/firewall-cmd|firewalld/.test(text)) add("firewall","network","port");
    if (/curl|http|https|nginx|httpd|apache/.test(text)) add("web","network","service");
    if (/\bss\b|netstat|nc\s|port|منفذ/.test(text)) add("network","port");
    if (/chmod|chown|permission|صلاح|namei|ls -l/.test(text)) add("permissions","filesystem");
    if (/selinux|ausearch|restorecon|semanage|getsebool/.test(text)) add("selinux","permissions");
    if (/df\s|du\s|lsblk|mount|findmnt|lvm|lvextend|vgs|pvs/.test(text)) add("storage","filesystem");
    if (/ping|ip\s|nmcli|route|dns|getent/.test(text)) add("network");
    return { text, domains };
  }

  extractVariables(command, output, current) {
    const variables = { ...(current || {}) };
    const cmd = String(command || "");
    const put = (name, value) => {
      if (value && !variables[name]) variables[name] = String(value).replace(/^['"]|['"]$/g, "");
    };

    let match = cmd.match(/systemctl\s+(?:status|start|stop|restart|enable|disable|is-active|is-enabled)(?:\s+--\S+)*\s+([a-zA-Z0-9_.@-]+)/);
    if (match) put("SERVICE", match[1].replace(/\.service$/, ""));

    match = cmd.match(/(?:dnf|yum)\s+(?:install|remove|erase|info|search|update)\s+(?:-[^\s]+\s+)*([a-zA-Z0-9_.+:-]+)/);
    if (match) put("PACKAGE", match[1]);

    match = cmd.match(/(?:--add-port|--remove-port|--query-port)=?(\d+)\/(tcp|udp)/i);
    if (match) { put("PORT", match[1]); put("PROTOCOL", match[2].toLowerCase()); }

    match = cmd.match(/ssh(?:\s+-p\s+(\d+))?\s+([a-zA-Z0-9_.-]+)@([a-zA-Z0-9_.:-]+)/);
    if (match) { put("PORT", match[1] || "22"); put("USER", match[2]); put("HOST", match[3]); }

    const portOutput = String(output || "").match(/(?:0\.0\.0\.0|\*|\[::\]|127\.0\.0\.1):(\d+)/);
    if (portOutput) put("PORT", portOutput[1]);

    const userOutput = String(output || "").match(/invalid user\s+([a-zA-Z0-9_.-]+)/i);
    if (userOutput) put("USER", userOutput[1]);

    const firstCommand = cmd.trim().replace(/^sudo\s+/, "").match(/^([a-zA-Z0-9_.-]+)/);
    if (firstCommand) put("COMMAND", firstCommand[1]);

    const urlMatch = cmd.match(/https?:\/\/([^\/:\s]+)(?::(\d+))?/i);
    if (urlMatch) { put("HOST", urlMatch[1]); if (urlMatch[2]) put("PORT", urlMatch[2]); }

    const hostCommand = cmd.match(/(?:ping(?:\s+-\S+\s+)*|nc(?:\s+-\S+\s+)*|getent\s+hosts\s+|dig\s+|host\s+)([a-zA-Z0-9_.:-]+)/i);
    if (hostCommand) put("HOST", hostCommand[1]);

    const pathOutput = String(output || "").match(/(?:^|\s)(\/(?:[^\s:'"]+\/?)+)(?::|\s|$)/m);
    if (pathOutput) put("PATH", pathOutput[1].replace(/[),.;]+$/, ""));

    const sudoUser = String(output || "").match(/^([a-zA-Z0-9_.-]+) is not in the sudoers file/im);
    if (sudoUser) put("USER", sudoUser[1]);

    return variables;
  }

  resolveItems(items, variables) {
    return (items || []).map(item => ({
      ...item,
      title_ar:this.resolve(item.title_ar,variables),
      command:this.resolve(item.command,variables),
      expected_result_ar:this.resolve(item.expected_result_ar,variables)
    }));
  }

  resolve(text, variables) {
    let output = String(text || "");
    for (const [name, value] of Object.entries(variables || {})) {
      if (value) output = output.replaceAll(`<${name}>`, value);
    }
    return output;
  }

  fallbackChecks(domains, variables) {
    const order = [...domains].filter(domain => domain !== "global");
    order.push("global");
    const output = [], seen = new Set();
    for (const domain of order) {
      for (const item of this.data.fallbacks?.[domain] || []) {
        const resolved = {
          ...item,
          title_ar:this.resolve(item.title_ar,variables),
          command:this.resolve(item.command,variables),
          expected_result_ar:this.resolve(item.expected_result_ar,variables)
        };
        if (!seen.has(resolved.command)) {
          seen.add(resolved.command);
          output.push(resolved);
        }
        if (output.length >= 6) return output;
      }
    }
    return output;
  }

  contextVerification(context, variables) {
    if (context.domains.has("service")) return this.resolveItems([
      {title_ar:"Check Service status",command:"systemctl is-active <SERVICE>",expected_result_ar:"active"}
    ],variables);
    if (context.domains.has("network")) return this.resolveItems([
      {title_ar:"re Test connection",command:"nc -vz -w 5 <HOST> <PORT>",expected_result_ar:"succeeded"}
    ],variables);
    if (context.domains.has("packages")) return this.resolveItems([
      {title_ar:"Verification from package",command:"rpm -q <PACKAGE>",expected_result_ar:"Package name wisdarha"}
    ],variables);
    return [];
  }

  evidence(clean, match) {
    if (!match) return this.firstUsefulLines(clean,5);
    const lines = clean.split("\n");
    const lineIndex = clean.slice(0,match.index).split("\n").length - 1;
    return lines.slice(Math.max(0,lineIndex-1),Math.min(lines.length,lineIndex+3))
      .map(line => line.trim()).filter(Boolean);
  }

  firstUsefulLines(value, limit=5) {
    return String(value || "").split("\n").map(line => line.trim()).filter(Boolean).slice(0,limit);
  }
}

if (typeof window !== "undefined") window.ExecutionDiagnosticEngine = ExecutionDiagnosticEngine;
if (typeof module !== "undefined" && module.exports) module.exports = ExecutionDiagnosticEngine;
