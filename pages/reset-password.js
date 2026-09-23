import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

const api = {
  post(url, body) {
    return fetch(url, { method: 'POST', credentials: 'include', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) })
      .then(r => r.ok ? r.json() : r.json().then(e => { throw new Error(e.error || 'Error'); }));
  }
};

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) setMessage("Invalid reset link");
  }, [token]);

  async function handleReset() {
    if (!newPassword || !confirmPassword) { setMessage("All fields required"); return; }
    if (newPassword !== confirmPassword) { setMessage("Passwords do not match"); return; }
    setLoading(true);
    try {
      const res = await api.post('/api/auth?action=reset-password', { token, newPassword });
      setMessage(res.message);
      setTimeout(() => router.push('/'), 2000);
    } catch(e) {
      setMessage(e.message);
    }
    setLoading(false);
  }

  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#f0f4f8"}}>
      <Head><title>Reset Password - BPIT ERP</title></Head>
      <div style={{width:"min(400px, 92vw)",background:"#fff",borderRadius:16,boxShadow:"0 20px 40px rgba(0,0,0,0.1)",padding:"28px 20px",boxSizing:"border-box"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <img src="/logo.png" alt="BPIT Logo" style={{width:80,height:50,marginBottom:16}}/>
          <div style={{fontSize:24,fontWeight:800,color:"#0f2942"}}>Reset Password</div>
          <div style={{fontSize:14,color:"#64748b",marginTop:4}}>Enter your new password</div>
        </div>
        <div style={{marginBottom:16}}>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New Password"
            style={{width:"100%",padding:"12px 16px",border:"1.5px solid #e2e8f0",borderRadius:10,fontSize:14,outline:"none",boxSizing:"border-box",marginBottom:12}}/>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password"
            style={{width:"100%",padding:"12px 16px",border:"1.5px solid #e2e8f0",borderRadius:10,fontSize:14,outline:"none",boxSizing:"border-box"}}/>
        </div>
        {message && <div style={{background:message.includes("error")?"#fef2f2":"#f0fdf4",border:"1px solid "+(message.includes("error")?"#fecaca":"#bbf7d0"),borderRadius:8,padding:"10px 14px",color:message.includes("error")?"#ef4444":"#059669",fontSize:13,marginBottom:16}}>{message}</div>}
        <button onClick={handleReset} disabled={loading} style={{width:"100%",padding:"14px",background:"linear-gradient(135deg,#0f2942,#2563eb)",border:"none",borderRadius:12,color:"#fff",fontWeight:800,fontSize:15,cursor:"pointer",opacity:loading?0.6:1}}>
          {loading ? "Resetting..." : "Reset Password"}
        </button>
        <div style={{textAlign:"center",marginTop:16}}>
          <a href="/" style={{color:"#2563eb",textDecoration:"none",fontSize:14}}>Back to Login</a>
        </div>
      </div>
    </div>
  );
}