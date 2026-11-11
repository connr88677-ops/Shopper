"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = { id: string; username: string; display_name: string | null; bio: string | null };
type Catalog = { id: string; user_id: string; title: string; description: string; cover_url: string | null; visibility: "public" | "unlisted" | "private"; tags: string[]; created_at: string; profiles?: { username: string; display_name: string | null } | null; catalog_likes?: { user_id: string }[] };
type Item = { name: string; brand: string; product_url: string; image_url: string };
const supabase = createClient();

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [view, setView] = useState<"discover" | "mine" | "liked">("discover");
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState("all");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [visibility, setVisibility] = useState<"public" | "unlisted" | "private">("public");
  const [cover, setCover] = useState<File | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemBrand, setItemBrand] = useState("");
  const [itemUrl, setItemUrl] = useState("");
  const [itemImage, setItemImage] = useState<File | null>(null);

  const load = useCallback(async (userId?: string) => {
    const { data: auth } = await supabase.auth.getSession();
    setSession(auth.session);
    const uid = userId ?? auth.session?.user.id;
    if (uid) {
      const { data: p } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
      setProfile(p as Profile | null);
    } else setProfile(null);
    const { data, error } = await supabase.from("catalogs")
      .select("*, profiles(username,display_name), catalog_likes(user_id)")
      .order("created_at", { ascending: false });
    if (error) setMessage(error.message);
    else setCatalogs((data ?? []) as Catalog[]);
  }, []);

  useEffect(() => {
    load();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      window.setTimeout(() => load(next?.user.id), 0);
    });
    return () => listener.subscription.unsubscribe();
  }, [load]);

  const filtered = useMemo(() => catalogs.filter(c => {
    if (view === "mine" && c.user_id !== session?.user.id) return false;
    if (view === "liked" && !c.catalog_likes?.some(l => l.user_id === session?.user.id)) return false;
    if (view === "discover" && c.visibility !== "public") return false;
    if (tag !== "all" && !c.tags?.includes(tag)) return false;
    const q = search.trim().toLowerCase();
    if (q && ![c.title, c.description, ...(c.tags ?? []), c.profiles?.username ?? ""].join(" ").toLowerCase().includes(q)) return false;
    return true;
  }), [catalogs, view, tag, search, session]);

  const trending = useMemo(() => {
    const counts = new Map<string, number>();
    catalogs.filter(c => c.visibility === "public").forEach(c => c.tags?.forEach(t => counts.set(t, (counts.get(t) ?? 0) + 1)));
    return [...counts.entries()].sort((a,b) => b[1]-a[1]).slice(0,8).map(([t]) => t);
  }, [catalogs]);

  async function authenticate(e: FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("");
    try {
      if (authMode === "signup") {
        const clean = username.trim().toLowerCase();
        if (!/^[a-z0-9_]{3,24}$/.test(clean)) throw new Error("Username must be 3–24 characters: letters, numbers, underscores.");
        const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword, options: { data: { username: clean } } });
        if (error) throw error;
        setMessage("Account created. Check your email to confirm it, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
        if (error) throw error;
        setMessage("Signed in.");
      }
    } catch (err) { setMessage(err instanceof Error ? err.message : "Something went wrong."); }
    finally { setBusy(false); }
  }

  async function upload(file: File, folder: string) {
    if (!session?.user) throw new Error("Sign in before uploading images.");
    if (!["image/jpeg","image/png","image/webp","image/avif"].includes(file.type)) throw new Error("Use a JPG, PNG, WEBP, or AVIF image.");
    if (file.size > 5 * 1024 * 1024) throw new Error("Images must be 5 MB or smaller.");
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = session.user.id + "/" + folder + "-" + crypto.randomUUID() + "." + ext;
    const { error } = await supabase.storage.from("catalog-images").upload(path, file, { upsert: false, contentType: file.type });
    if (error) throw error;
    return supabase.storage.from("catalog-images").getPublicUrl(path).data.publicUrl;
  }

  async function createCatalog(e: FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("");
    try {
      if (!session?.user) throw new Error("Sign in to create a catalog.");
      let coverUrl: string | null = null;
      if (cover) coverUrl = await upload(cover, "cover");
      const cleanTags = [...new Set(tags.split(",").map(t => t.trim().replace(/^#/, "").toLowerCase()).filter(Boolean))].slice(0,12);
      const { data, error } = await supabase.from("catalogs").insert({
        user_id: session.user.id, title: title.trim(), description: description.trim(),
        cover_url: coverUrl, visibility, tags: cleanTags
      }).select().single();
      if (error) throw error;
      if (itemName.trim()) {
        const imageUrl = itemImage ? await upload(itemImage, "item") : null;
        const { error: itemError } = await supabase.from("catalog_items").insert({
          catalog_id: data.id, name: itemName.trim(), brand: itemBrand.trim(),
          product_url: itemUrl.trim() || null, image_url: imageUrl
        });
        if (itemError) throw itemError;
      }
      setShowCreate(false); setTitle(""); setDescription(""); setTags(""); setVisibility("public");
      setCover(null); setItemName(""); setItemBrand(""); setItemUrl(""); setItemImage(null);
      setMessage("Catalog created."); setView("mine"); await load();
    } catch (err) { setMessage(err instanceof Error ? err.message : "Could not create catalog."); }
    finally { setBusy(false); }
  }

  async function toggleLike(c: Catalog) {
    if (!session?.user) { setMessage("Sign in to save catalogs."); return; }
    const liked = c.catalog_likes?.some(l => l.user_id === session.user.id);
    const result = liked
      ? await supabase.from("catalog_likes").delete().eq("catalog_id", c.id).eq("user_id", session.user.id)
      : await supabase.from("catalog_likes").insert({ catalog_id: c.id, user_id: session.user.id });
    if (result.error) setMessage(result.error.message); else await load();
  }

  async function signOut() { await supabase.auth.signOut(); setMessage("Signed out."); }
  const heading = view === "mine" ? "Your catalogs" : view === "liked" ? "Saved catalogs" : "Picked for you";

  return <>
    <header className="top">
      <div className="logo"><b>f</b>fitstify</div>
      <input className="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search style, creators, #hashtags…" aria-label="Search catalogs" />
      <nav className="nav">
        {session ? <><button className="btn hide-mobile" onClick={()=>setView("liked")}>♡ Saved</button><button className="btn" onClick={signOut}>Sign out</button></> : <button className="btn" onClick={()=>document.getElementById("auth")?.scrollIntoView({behavior:"smooth"})}>Sign in</button>}
        <button className="btn dark" onClick={()=>session ? setShowCreate(true) : document.getElementById("auth")?.scrollIntoView({behavior:"smooth"})}>＋ Create</button>
      </nav>
    </header>
    <div className="layout">
      <aside className="sidebar">
        <div className="side-label">YOUR SPACE</div>
        <div className={"side-link "+(view==="discover"?"active":"")} onClick={()=>{setView("discover");setTag("all")}}>⌂　Discover</div>
        <div className={"side-link "+(view==="liked"?"active":"")} onClick={()=>setView("liked")}>♡　Liked catalogs</div>
        <div className={"side-link "+(view==="mine"?"active":"")} onClick={()=>setView("mine")}>▤　My catalogs</div>
        <div className="side-label" style={{marginTop:28}}>TRENDING TAGS</div>
        {trending.map(t=><div className="side-link" key={t} onClick={()=>{setTag(t);setView("discover")}}>#{t}</div>)}
        <div className="side-note">A home for your taste.<br/>Save the pieces. Build the vision.<br/><br/>Your catalogs, all in one place.</div>
      </aside>
      <main>
        <section className="hero"><div><div className="eyebrow">A catalog of your taste</div><h1>Collect your kind<br/>of style.</h1><p>Discover pieces, build catalogs, and find your next inspiration.</p></div><div className="toolbar"><button className="btn" onClick={()=>setView("mine")}>Your collections ↗</button><button className="btn dark" onClick={()=>session?setShowCreate(true):document.getElementById("auth")?.scrollIntoView({behavior:"smooth"})}>Make a catalog ＋</button></div></section>
        <div className="chips">{["all","streetwear","archive","minimal","vintage","designer"].map(t=><button key={t} className={"chip "+(tag===t?"active":"")} onClick={()=>setTag(t)}>{t==="all"?"For you":t}</button>)}</div>
        <div className="section-head"><h2>{heading}</h2><span className="muted">{filtered.length} catalogs</span></div>
        <div className="grid">{filtered.map(c=><article className="catalog" key={c.id}>
          <div className="cover">{c.cover_url ? <img src={c.cover_url} alt={c.title}/> : <div style={{height:"100%",display:"grid",placeItems:"center",color:"#777"}}>FITSTIFY</div>}</div>
          <div className="catalog-title">{c.title}</div>
          <div className="catalog-meta">by @{c.profiles?.username ?? "creator"} · {c.visibility}</div>
          {c.description && <p className="catalog-meta">{c.description}</p>}
          <div className="tags">{(c.tags??[]).map(t=>"#"+t).join("　")}</div>
          <div style={{marginTop:10}}><button className={"like "+(c.catalog_likes?.some(l=>l.user_id===session?.user.id)?"on":"")} onClick={()=>toggleLike(c)}>♡ {c.catalog_likes?.length ?? 0}</button></div>
        </article>)}
        {filtered.length===0 && <div className="empty"><h3>{view==="mine"?"Your first catalog starts here.":view==="liked"?"Nothing saved yet.":"Nothing here just yet."}</h3><p>{view==="discover"?"Be the first to publish a public catalog.":"Build a collection or explore public catalogs."}</p>{view!=="discover" && <button className="btn dark" onClick={()=>session?setShowCreate(true):document.getElementById("auth")?.scrollIntoView({behavior:"smooth"})}>Create a catalog</button>}</div>}</div>
        {message && <p className="notice">{message}</p>}
        {!session && <section className="panel auth" id="auth"><div className="eyebrow">JOIN THE COMMUNITY</div><h2>{authMode==="signup"?"Create your account.":"Welcome back."}</h2><p className="notice">Create an account to publish catalogs and save your favorite finds.</p><form onSubmit={authenticate}>
          {authMode==="signup" && <div className="field"><label>Username</label><input value={username} onChange={e=>setUsername(e.target.value)} required minLength={3} maxLength={24} placeholder="yourname" /></div>}
          <div className="field"><label>Email</label><input type="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} required placeholder="you@example.com"/></div>
          <div className="field"><label>Password</label><input type="password" value={authPassword} onChange={e=>setAuthPassword(e.target.value)} required minLength={8} placeholder="At least 8 characters"/></div>
          <button className="btn dark" disabled={busy}>{busy?"Please wait…":authMode==="signup"?"Create account":"Sign in"}</button>
        </form><p className="notice">{authMode==="signup"?"Already have an account?":"New to Fitstify?"} <button className="auth-switch" onClick={()=>setAuthMode(authMode==="signup"?"signin":"signup")}>{authMode==="signup"?"Sign in":"Create an account"}</button></p></section>}
      </main>
    </div>
    {showCreate && <div className="panel" style={{maxWidth:680,margin:"0 auto 50px"}}><div className="section-head"><h2>Build a catalog</h2><button className="btn" onClick={()=>setShowCreate(false)}>Close</button></div><form onSubmit={createCatalog}>
      <div className="field"><label>Catalog name *</label><input value={title} onChange={e=>setTitle(e.target.value)} required maxLength={70} placeholder="My everyday rotation"/></div>
      <div className="field"><label>Description</label><textarea value={description} onChange={e=>setDescription(e.target.value)} maxLength={280}/></div>
      <div className="row"><div className="field"><label>Cover image</label><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={e=>setCover(e.target.files?.[0]??null)}/></div><div className="field"><label>Tags (comma separated)</label><input value={tags} onChange={e=>setTags(e.target.value)} placeholder="archive, streetwear"/></div></div>
      <div className="field"><label>Visibility</label><select value={visibility} onChange={e=>setVisibility(e.target.value as typeof visibility)}><option value="public">Public — appears in discovery</option><option value="unlisted">Unlisted — accessible by link</option><option value="private">Private — only you</option></select></div>
      <div className="section-head"><h2>First piece (optional)</h2></div>
      <div className="field"><label>Item name</label><input value={itemName} onChange={e=>setItemName(e.target.value)} placeholder="Washed black denim"/></div>
      <div className="row"><div className="field"><label>Brand</label><input value={itemBrand} onChange={e=>setItemBrand(e.target.value)}/></div><div className="field"><label>Product link</label><input type="url" value={itemUrl} onChange={e=>setItemUrl(e.target.value)} placeholder="https://…"/></div></div>
      <div className="field"><label>Item image</label><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={e=>setItemImage(e.target.files?.[0]??null)}/></div>
      <p className="notice">Images must be JPG, PNG, WEBP, or AVIF and 5 MB or smaller.</p>
      <button className="btn dark" disabled={busy}>{busy?"Creating…":"Create catalog ↗"}</button>
    </form></div>}
    <footer className="footer"><span>© 2026 Fitstify · Made for people with taste.</span><span>Community · Privacy · Guidelines</span></footer>
  </>;
}