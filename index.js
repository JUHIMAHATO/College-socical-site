
  document.addEventListener("DOMContentLoaded", () => {
    // Simple DB util
    const DB = {
      get: (k) => JSON.parse(localStorage.getItem(k) || "[]"),
      set: (k, v) => localStorage.setItem(k, JSON.stringify(v))
    };

    // Init defaults
    if(!localStorage.getItem("colleges")) DB.set("colleges", ["My College"]);
    if(!localStorage.getItem("users")) DB.set("users", []);

    const signupPane = document.querySelector("#signup-pane");
    const loginPane = document.querySelector("#login-pane");
    const resetPane = document.querySelector("#reset-pane");
    const suCollegeSelect = document.querySelector("#su_college_select");

    function refreshColleges(){
      const colleges = DB.get("colleges");
      suCollegeSelect.innerHTML = '<option value="">Select college</option>';
      colleges.forEach(c=>{
        const opt = document.createElement("option");
        opt.value=c; opt.textContent=c;
        suCollegeSelect.appendChild(opt);
      });
    }
    refreshColleges();

    // Pane switching
    document.querySelector("#showLogin").onclick = ()=>{ signupPane.style.display="none"; loginPane.style.display="block"; resetPane.style.display="none"; };
    document.querySelector("#showSignup").onclick = ()=>{ signupPane.style.display="block"; loginPane.style.display="none"; resetPane.style.display="none"; };
    document.querySelector("#showReset").onclick = ()=>{ signupPane.style.display="none"; loginPane.style.display="none"; resetPane.style.display="block"; };
    document.querySelector("#backLogin").onclick = ()=>{ signupPane.style.display="none"; loginPane.style.display="block"; resetPane.style.display="none"; };

    // Signup
    document.querySelector("#btnSignup").onclick = ()=>{
      const name = document.querySelector("#su_name").value.trim();
      const email = document.querySelector("#su_email").value.trim().toLowerCase();
      const pass = document.querySelector("#su_password").value;
      const newCol = document.querySelector("#su_college_new").value.trim();
      const college = newCol || suCollegeSelect.value;

      if(!name || !email || !pass || !college) return alert("Fill all fields!");
      const users = DB.get("users");
      if(users.find(u=>u.email===email)) return alert("Email already exists!");

      let colleges = DB.get("colleges");
      if(newCol && !colleges.includes(newCol)){ colleges.push(newCol); DB.set("colleges", colleges); refreshColleges(); }

      users.push({name, email, password:pass, college});
      DB.set("users", users);
      DB.set("session", {email});
      location.href="feed.html";
    };

    // Login
    document.querySelector("#btnLogin").onclick = ()=>{
      const email = document.querySelector("#li_email").value.trim().toLowerCase();
      const pass = document.querySelector("#li_password").value;
      const users = DB.get("users");
      const u = users.find(x=>x.email===email && x.password===pass);
      if(!u) return alert("Invalid credentials!");
      DB.set("session", {email});
      location.href="feed.html";
    };

    // Reset
    document.querySelector("#btnReset").onclick = ()=>{
      const email = document.querySelector("#rs_email").value.trim().toLowerCase();
      const users = DB.get("users");
      const u = users.find(x=>x.email===email);
      if(!u) return alert("No account found!");
      const np = prompt("Enter new password for " + email);
      if(np){ u.password=np; DB.set("users", users); alert("Password updated!"); loginPane.style.display="block"; resetPane.style.display="none"; }
    };
  });
  