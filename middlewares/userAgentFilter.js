const suspiciousAgents = [
  "curl", "python", "sqlmap", "nmap", "wget", "fuzzer", "libwww", "scan",
  "nikto", "acunetix", "paros", "netsparker", "nessus", "hydra", "zaproxy"
  ];
  
  function userAgentFilter(req, res, next) {
    const userAgent = req.headers["user-agent"] || "";
  
    const isSuspicious = suspiciousAgents.some(agent =>
      userAgent.toLowerCase().includes(agent)
    );
  
    if (!userAgent || userAgent.length < 10 || isSuspicious) {
      return res.status(403).json({ message: "Blocked: Suspicious User-Agent" });
    }
  
    next();
  }
  
  module.exports = userAgentFilter;
  