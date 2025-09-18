// script.js - College Social (vanilla)

document.addEventListener("DOMContentLoaded", () => {
  window.DB = {
    get(key) { try { return JSON.parse(localStorage.getItem(key)) || null } catch(e) { return null } },
    set(key, val) { localStorage.setItem(key, JSON.stringify(val)) },
    remove(key) { localStorage.removeItem(key) }
  };

  if (!DB.get('colleges')) DB.set('colleges', ['My College']);
  if (!DB.get('users')) DB.set('users', []);
  if (!DB.get('posts')) DB.set('posts', []);
  if (!DB.get('settings')) DB.set('settings', { theme: 'light' });

  window.currentUser = () => DB.get('session');
  window.requireLogin = () => {
    if (!currentUser()) { location.href = 'index.html'; return false; }
    return true;
  };

  window.uid = () => Date.now() + '-' + Math.floor(Math.random() * 9999);
  window.escapeHTML = s => s ? s.replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';') : '';
});

document.addEventListener('DOMContentLoaded', () => {

  const DB = window.DB;

  function currentUser() { return DB.get('session'); }
  function requireLogin() {
    if (!currentUser()) { location.href = 'index.html'; return false; }
    return true;
  }

  function uid() { return Date.now() + '-' + Math.floor(Math.random() * 9999); }
  function el(q) { return document.querySelector(q); }
  function els(q) { return Array.from(document.querySelectorAll(q)); }
  function escapeHTML(s) { return s ? s.replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';') : ''; }

  // ---------- AUTH ----------
  if (location.pathname.endsWith('index.html') || location.pathname.endsWith('/')) {
    const su_col_select = el('#su_college_select');
    const su_col_new = el('#su_college_new');

    function refreshCollegeOptions() {
      const cs = DB.get('colleges');
      su_col_select.innerHTML = cs.map(c => `<option>${c}</option>`).join('');
    }
    refreshCollegeOptions();

    el('#showSignup').onclick = () => { el('#signup-pane').style.display='block'; el('#login-pane').style.display='none'; el('#reset-pane').style.display='none'; }
    el('#showLogin').onclick = () => { el('#signup-pane').style.display='none'; el('#login-pane').style.display='block'; el('#reset-pane').style.display='none'; }
    el('#showReset').onclick = () => { el('#signup-pane').style.display='none'; el('#login-pane').style.display='none'; el('#reset-pane').style.display='block'; }
    el('#backLogin').onclick = () => { el('#signup-pane').style.display='none'; el('#login-pane').style.display='block'; el('#reset-pane').style.display='none'; }

    el('#btnSignup').onclick = () => {
      const name = el('#su_name').value.trim();
      const email = el('#su_email').value.trim().toLowerCase();
      const password = el('#su_password').value;
      const colNew = su_col_new.value.trim();
      const col = colNew || su_col_select.value;

      if (!name || !email || !password || !col) { alert('Fill all fields'); return; }
      const users = DB.get('users');
      if (users.find(u=>u.email===email)) { alert('Email exists'); return; }

      let colleges = DB.get('colleges');
      if (colNew && !colleges.includes(colNew)) { colleges.push(colNew); DB.set('colleges', colleges); refreshCollegeOptions(); }

      const newUser = { name, email, password, college: col, bio:'', photo:'', following:[] };
      users.push(newUser); DB.set('users', users);
      DB.set('session', { email });
      location.href = 'feed.html';
    };

    el('#btnLogin').onclick = () => {
      const email = el('#li_email').value.trim().toLowerCase();
      const password = el('#li_password').value;
      const users = DB.get('users') || [];
      const u = users.find(x=>x.email===email && x.password===password);
      if(!u){ alert('Invalid credentials'); return; }
      DB.set('session', { email });
      location.href='feed.html';
    };

    el('#btnReset').onclick = () => {
      const email = el('#rs_email').value.trim().toLowerCase();
      const users = DB.get('users');
      const u = users.find(x=>x.email===email);
      if(!u){ alert('No account'); return; }
      const np = prompt('Enter new password for ' + email);
      if(np){ u.password=np; DB.set('users', users); alert('Password updated'); el('#login-pane').style.display='block'; el('#reset-pane').style.display='none'; }
    };
  }

  // ---------- FEED ----------
  if(location.pathname.endsWith('feed.html')){
    if(!requireLogin()) throw 'not logged in';
    const feedEl = el('#feed');
    const createForm = el('#createForm');
    const toggleCreate = el('#toggleCreate');
    const btnPost = el('#btnPost');
    const searchBar = el('#searchBar');
    const filterFeed = el('#filterFeed');

    const navName = el('#navName');
    const navAvatar = el('#navAvatar');
    const goProfile = el('#goProfile');
    const doLogout = el('#doLogout');
    const viewMore = el('#viewMore');

    const session = currentUser();
    let users = DB.get('users');
    const me = users.find(u=>u.email===session.email);
    navName.innerText = me.name;
    navAvatar.src = me.photo || 'https://via.placeholder.com/150';

    goProfile.onclick = ()=>location.href='profile.html';
    doLogout.onclick = ()=>{ DB.remove('session'); location.href='index.html'; };

    // Toggle Create
    toggleCreate.onclick = ()=>{
      if(createForm.style.display==='none'){
        createForm.style.display='block';
        createForm.style.opacity=0;
        setTimeout(()=>createForm.style.opacity=1,10);
      }else{
        createForm.style.opacity=0;
        setTimeout(()=>createForm.style.display='none',300);
      }
    };

    btnPost.onclick=(ev)=>{
      ev.preventDefault();
      const text=el('#postText').value.trim();
      const img=el('#postImage').value.trim();
      if(!text&&!img){alert('Post cannot be empty'); return;}
      const posts=DB.get('posts')||[];
      posts.unshift({id:uid(), userEmail:me.email, content:text, image:img, timestamp:(new Date()).toISOString(), likes:[], comments:[]});
      DB.set('posts',posts);
      el('#postText').value=''; el('#postImage').value='';
      renderFeed();
      createForm.style.display='none';
    };

    // ---------- Post Rendering & Actions ----------
    window.toggleLike = function(postId){
      const posts=DB.get('posts');
      const p=posts.find(x=>x.id===postId);
      if(!p) return;
      const idx=p.likes.indexOf(me.email);
      if(idx===-1) p.likes.push(me.email); else p.likes.splice(idx,1);
      DB.set('posts',posts);
      renderFeed();
    };

    window.addComment = function(postId,input){
      const text=input.value.trim();
      if(!text) return;
      const posts=DB.get('posts');
      const p=posts.find(x=>x.id===postId);
      p.comments=p.comments||[];
      p.comments.push({user:me.name,text});
      DB.set('posts',posts);
      renderFeed();
    };

    window.focusComment=function(postId){
      const art=document.querySelector(`[data-id="${postId}"]`);
      if(!art) return;
      const input=art.querySelector('.comments input');
      input && input.focus();
    };

    window.sharePost=function(id){
      navigator.clipboard?.writeText(location.href+'#post-'+id).then(()=>alert('Link copied'));
    };

    window.deletePost=function(id){
      if(!confirm('Delete post?')) return;
      const posts=DB.get('posts').filter(p=>p.id!==id);
      DB.set('posts',posts);
      renderFeed();
    };

    function displayName(email){
      const u=DB.get('users').find(x=>x.email===email);
      return u?u.name.split(' ')[0]:email;
    }

    function likeSummary(arr){
      if(arr.length===0) return '';
      if(arr.length===1) return `Liked by ${displayName(arr[0])}`;
      if(arr.length===2) return `Liked by ${displayName(arr[0])} and ${displayName(arr[1])}`;
      return `Liked by ${displayName(arr[0])} and ${arr.length-1} others`;
    }

    function renderPostMarkup(p){
      const usersAll = DB.get('users');
      const owner = usersAll.find(u=>u.email===p.userEmail)||{name:'Unknown',photo:''};
      const likedByMe = p.likes.includes(me.email);
      const likeCount = p.likes.length;
      const commentCount = p.comments.length;
      const time = new Date(p.timestamp).toLocaleString();
      const likeIcon = likedByMe?'❤️':'🤍';
      const commentsHTML = p.comments.map(c=>`<div><strong>${c.user}</strong>: ${c.text}</div>`).join('');
      return `
      <article class="card post" data-id="${p.id}">
        <div class="meta">
          <img class="avatar-sm" src="${owner.photo||'https://via.placeholder.com/150'}">
          <div>
            <div><strong>${owner.name}</strong></div>
            <div class="muted" style="font-size:12px">${time}</div>
          </div>
        </div>

        <div class="content"><p>${escapeHTML(p.content)}</p>${p.image?`<img src="${p.image}" style="max-width:100%;border-radius:8px;margin-top:8px">`:''}</div>

        <div class="actions">
          <button onclick="toggleLike('${p.id}')">${likeIcon} <span class="like-count">${likeCount}</span></button>
          <button onclick="focusComment('${p.id}')">💬 <span class="comment-count">${commentCount}</span></button>
          <button onclick="sharePost('${p.id}')">🔗 Share</button>
          ${p.userEmail===me.email?`<button onclick="deletePost('${p.id}')">🗑️ Delete</button>`:''}
        </div>

        <div class="like-info muted" style="margin-top:6px">${likeSummary(p.likes)}</div>

        <div class="comments" style="margin-top:8px">
          <div class="comment-list">${commentsHTML}</div>
          <input placeholder="Add a comment..." onkeydown="if(event.key==='Enter'){addComment('${p.id}', this)}"/>
        </div>
      </article>
      `;
    }

    let postsToShow = 5;
    const viewMoreEl = el('#viewMore');
    viewMoreEl.onclick = () => { postsToShow += 5; renderFeed(); };

    function renderFeed(){
      const posts = (DB.get('posts')||[]).filter(p=>{
        const owner = DB.get('users').find(u=>u.email===p.userEmail);
        return owner && owner.college===me.college;
      }).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));
      const toDisplay = posts.slice(0, postsToShow);
      feedEl.innerHTML = toDisplay.map(p=>renderPostMarkup(p)).join('') || `<div class="card muted">No posts yet from your college.</div>`;
    }

    renderFeed();
  }

  // ---------- PROFILE ----------
  if(location.pathname.endsWith('profile.html')){
    if(!requireLogin()) throw 'not logged in';
    const session=currentUser();
    let users=DB.get('users');
    let u=users.find(x=>x.email===session.email);
    if(!u){ alert('No user'); location.href='index.html'; }

    const profileImg=el('#profileImg');
    const fileInput=el('#fileInput');
    const pf_name=el('#pf_name'), pf_bio=el('#pf_bio'), pf_url=el('#pf_url'), pf_college=el('#pf_college');
    const saveBtn=el('#saveProfile'), cancelBtn=el('#cancelProfile');
    const goFeed=el('#goFeed'), doLogout=el('#doLogout');

    function loadProfile(){
      users=DB.get('users');
      u=users.find(x=>x.email===session.email);
      pf_name.value=u.name;
      pf_bio.value=u.bio||'';
      pf_url.value=u.photo||'';
      pf_college.value=u.college||'';
      profileImg.src=u.photo||'https://via.placeholder.com/150';
    }
    loadProfile();

    fileInput.onchange=(ev)=>{
      const f=ev.target.files[0];
      if(!f) return;
      const reader=new FileReader();
      reader.onload=e=>{ profileImg.src=e.target.result; };
      reader.readAsDataURL(f);
    };

    pf_url.onblur=()=>{ const url=pf_url.value.trim(); if(url) profileImg.src=url; };

    saveBtn.onclick=(ev)=>{
      ev.preventDefault();
      users=DB.get('users');
      u=users.find(x=>x.email===session.email);
      u.name=pf_name.value.trim();
      u.bio=pf_bio.value.trim();
      u.photo=profileImg.src;
      DB.set('users',users);
      alert('Profile saved');
    };

    cancelBtn.onclick=()=>loadProfile();
    goFeed.onclick=()=>location.href='feed.html';
    doLogout.onclick=()=>{ DB.remove('session'); location.href='index.html'; };
  }

});


