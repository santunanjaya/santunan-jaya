import React, { useState, useEffect } from 'react';
import { 
  Home, Users, Bell, FileText, Phone, Menu, X, 
  Wallet, ChevronRight, FileCheck, AlertCircle, Calendar,
  MapPin, Home as HomeIcon, Search, Lock, LogOut, Trash2, Plus, CheckCircle,
  Megaphone, UserCog, Edit, Check, ExternalLink
} from 'lucide-react';

// === IMPORT FIREBASE ===
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

// ==========================================
// PASTE FIREBASE CONFIG ANDA DI BAWAH INI
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyBA2MySUXB7cqlbFeGMpQrjRU_MiMzQQ60",
  authDomain: "santunan-jaya.firebaseapp.com",
  projectId: "santunan-jaya",
  storageBucket: "santunan-jaya.firebasestorage.app",
  messagingSenderId: "683091231734",
  appId: "1:683091231734:web:a4259a84e5d4e90bb43dd7"
};

let db = null;
try {
  if (firebaseConfig.apiKey !== "API_KEY_ANDA") {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  }
} catch (error) {
  console.error("Firebase error:", error);
}

export default function App() {
  // --- STATE UNTUK ROUTING & AUTH ---
  const [activeTab, setActiveTab] = useState('beranda');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [notification, setNotification] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- DATABASE STATE ---
  const [dataWarga, setDataWarga] = useState([]);
  const [laporanKas, setLaporanKas] = useState([]);
  const [laporanWarga, setLaporanWarga] = useState([]);
  const [pengumuman, setPengumuman] = useState([]);
  const [pengurus, setPengurus] = useState([]);

  // --- ADMIN DASHBOARD STATES ---
  const [adminMenu, setAdminMenu] = useState('dashboard');
  const [newWarga, setNewWarga] = useState({ nama: '', jalan: 'Jl. Santunan 1', noRumah: '', status: 'Penetap' });
  const [newKas, setNewKas] = useState({ tanggal: '', keterangan: '', masuk: 0, keluar: 0 });
  const [newPengumuman, setNewPengumuman] = useState({ judul: '', tanggal: '', deskripsi: '', tipe: 'info', link: '' });
  const [catatanInput, setCatatanInput] = useState({});
  const [formPengurus, setFormPengurus] = useState({ id: null, username: '', password: '', role: 'admin_biasa', nama: '' });

  // --- PUBLIC VIEW STATES ---
  const [searchQuery, setSearchQuery] = useState('');
  const [formLapor, setFormLapor] = useState({ nama: '', jalan: 'Jl. Santunan 1', pesan: '', kategori: 'Fasilitas Umum' });

  // ==========================================
  // EFEK SINKRONISASI FIREBASE
  // ==========================================
  useEffect(() => {
    if (!db) {
      setDataWarga([{ id: 1, nama: 'Bpk. Ahmad Budi', jalan: 'Jl. Santunan 1', noRumah: '1A', status: 'Penetap' }]);
      setLaporanKas([{ id: 1, tanggal: '01 Mei 2026', keterangan: 'Iuran Kas', masuk: 1500000, keluar: 0 }]);
      setLaporanWarga([{ id: 1, nama: 'Bpk. Budi', jalan: 'Jl. Santunan 1', kategori: 'Fasilitas Umum', pesan: 'Lampu jalan mati', status: 'Menunggu', catatanAdmin: '' }]);
      setPengumuman([{ id: 1, judul: 'Kerja Bakti', tanggal: '28 Mei 2026', deskripsi: 'Membersihkan selokan.', tipe: 'info', link: '' }]);
      return;
    }

    const unsubWarga = onSnapshot(collection(db, "warga"), snap => setDataWarga(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubKas = onSnapshot(collection(db, "kas"), snap => setLaporanKas(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubLapor = onSnapshot(collection(db, "laporan"), snap => setLaporanWarga(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubPengumuman = onSnapshot(collection(db, "pengumuman"), snap => setPengumuman(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubPengurus = onSnapshot(collection(db, "pengurus"), snap => setPengurus(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    return () => { unsubWarga(); unsubKas(); unsubLapor(); unsubPengumuman(); unsubPengurus(); };
  }, []);

  // --- LOGIC AUTHENTICATION ---
  const handleLogin = (e) => {
    e.preventDefault();
    let user = pengurus.find(u => u.username === loginForm.username && u.password === loginForm.password);


    if (user) {
      setCurrentUser(user);
      setIsAdminMode(true);
      setShowLogin(false);
      setActiveTab('admin_dashboard');
      setLoginForm({ username: '', password: '' });
      setLoginError('');
      showNotification(`Selamat datang, ${user.nama}!`);
    } else {
      setLoginError('Username atau password salah!');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAdminMode(false);
    setActiveTab('beranda');
    showNotification('Anda telah keluar dari sistem admin.');
  };

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  // --- KUMPULAN FUNGSI HELPER ---
  const totalMasuk = laporanKas.reduce((acc, curr) => acc + Number(curr.masuk || 0), 0);
  const totalKeluar = laporanKas.reduce((acc, curr) => acc + Number(curr.keluar || 0), 0);
  const saldoAkhir = totalMasuk - totalKeluar;
  const rekapJalan = dataWarga.reduce((acc, curr) => {
    acc[curr.jalan] = (acc[curr.jalan] || 0) + 1;
    return acc;
  }, {});

  const navigateTo = (tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  // ==========================================
  // VIEW RENDERERS
  // ==========================================
  const renderNotificationBar = () => {
    if (!notification) return null;
    return (
      <div className="fixed top-20 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-right">
        <CheckCircle size={20} />
        <span className="font-medium text-sm">{notification}</span>
      </div>
    );
  };

  const renderLoginModal = () => (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="bg-emerald-700 p-6 text-white flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center gap-2"><Lock size={24}/> Login Pengurus</h2>
          <button onClick={() => setShowLogin(false)} className="hover:bg-emerald-600 p-1 rounded-full"><X size={24}/></button>
        </div>
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {loginError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">{loginError}</div>}
          <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-800 mb-4 border border-blue-200">
            <strong>Catatan:</strong> Jika belum ada akun, gunakan <code>superadmin</code> / <code>123</code> untuk masuk pertama kali.
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input type="text" required value={loginForm.username} onChange={(e) => setLoginForm({...loginForm, username: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" required value={loginForm.password} onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
          </div>
          <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition-colors">Masuk</button>
        </form>
      </div>
    </div>
  );

  const renderAdminDashboard = () => {
    const isSuperAdmin = currentUser?.role === 'super_admin';

    const hapusWarga = async (id) => { if (db) await deleteDoc(doc(db, "warga", id)); showNotification('Data dihapus.'); };
    const tambahWarga = async (e) => {
      e.preventDefault();
      if (db) await addDoc(collection(db, "warga"), newWarga);
      setNewWarga({ nama: '', jalan: 'Jl. Santunan 1', noRumah: '', status: 'Penetap' });
      showNotification('Warga ditambahkan.');
    };

    const tambahKas = async (e) => {
      e.preventDefault();
      if (db) await addDoc(collection(db, "kas"), { ...newKas, masuk: Number(newKas.masuk), keluar: Number(newKas.keluar) });
      setNewKas({ tanggal: '', keterangan: '', masuk: 0, keluar: 0 });
      showNotification('Kas dicatat.');
    };

    // FITUR BARU: Hapus Kas + log aktivitas
    const hapusKas = async (id, entryTanggal, entryKeterangan) => {
      if (!db) return;
      try {
        await deleteDoc(doc(db, "kas", id));
        // Catat log penghapusan
        await addDoc(collection(db, "log_aktivitas"), {
          aksi: 'hapus_kas',
          idKas: id,
          keterangan: `${entryTanggal} - ${entryKeterangan}`,
          oleh: currentUser?.nama || 'Unknown',
          waktu: new Date().toISOString()
        });
        showNotification(`Kas dihapus oleh ${currentUser?.nama}`);
      } catch (err) {
        console.error(err);
        showNotification('Gagal menghapus kas.');
      }
    };

    const tambahPengumuman = async (e) => {
      e.preventDefault();
      if (db) await addDoc(collection(db, "pengumuman"), newPengumuman);
      setNewPengumuman({ judul: '', tanggal: '', deskripsi: '', tipe: 'info', link: '' });
      showNotification('Pengumuman di-publish.');
    };
    const hapusPengumuman = async (id) => { if (db) await deleteDoc(doc(db, "pengumuman", id)); showNotification('Pengumuman dihapus.'); };

    const updateLaporan = async (id, statusBaru) => {
      if (!db) return;
      const catatan = catatanInput[id] || '';
      await updateDoc(doc(db, "laporan", id), { status: statusBaru, catatanAdmin: catatan });
      showNotification(`Laporan ditandai ${statusBaru}.`);
    };
    const hapusLaporan = async (id) => { if (db) await deleteDoc(doc(db, "laporan", id)); showNotification('Laporan dihapus.'); };

    const simpanPengurus = async (e) => {
      e.preventDefault();
      if (!db) return;
      if (formPengurus.id) {
        await updateDoc(doc(db, "pengurus", formPengurus.id), { nama: formPengurus.nama, username: formPengurus.username, password: formPengurus.password, role: formPengurus.role });
        showNotification('Data pengurus diperbarui.');
      } else {
        await addDoc(collection(db, "pengurus"), { nama: formPengurus.nama, username: formPengurus.username, password: formPengurus.password, role: formPengurus.role });
        showNotification('Pengurus baru ditambahkan.');
      }
      setFormPengurus({ id: null, username: '', password: '', role: 'admin_biasa', nama: '' });
    };
    const hapusPengurus = async (id) => { if (db) await deleteDoc(doc(db, "pengurus", id)); showNotification('Pengurus dihapus.'); };
    const editPengurus = (p) => setFormPengurus(p);

    return (
      <div className="flex flex-col md:flex-row gap-6">
        {/* Admin Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-900 p-4 text-white">
              <p className="text-xs text-gray-400">Login sebagai:</p>
              <h3 className="font-bold">{currentUser?.nama}</h3>
              <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full mt-2 inline-block ${isSuperAdmin ? 'bg-purple-500' : 'bg-blue-500'}`}>
                {isSuperAdmin ? 'Super Admin' : 'Admin Biasa'}
              </span>
            </div>
            <div className="flex flex-col p-2 gap-1">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: <HomeIcon size={18}/> },
                { id: 'kelola_warga', label: 'Kelola Warga', icon: <Users size={18}/> },
                { id: 'kelola_kas', label: 'Kelola Kas', icon: <Wallet size={18}/> },
                { id: 'kelola_laporan', label: 'Log Laporan', icon: <AlertCircle size={18}/> },
                { id: 'kelola_pengumuman', label: 'Pengumuman', icon: <Megaphone size={18}/> },
              ].map(menu => (
                <button
                  key={menu.id} onClick={() => setAdminMenu(menu.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left ${adminMenu === menu.id ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {menu.icon} {menu.label}
                </button>
              ))}
              
              {isSuperAdmin && (
                <button
                  onClick={() => setAdminMenu('pengaturan_sistem')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left mt-4 border-t border-gray-100 ${adminMenu === 'pengaturan_sistem' ? 'bg-purple-50 text-purple-700' : 'text-purple-600 hover:bg-purple-50'}`}
                >
                  <UserCog size={18}/> Kelola Akun (SA)
                </button>
              )}

              <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 text-left mt-4 border-t">
                <LogOut size={18}/> Keluar
              </button>
            </div>
          </div>
        </div>

        {/* Admin Content Area */}
        <div className="flex-1 space-y-6">
          
          {adminMenu === 'dashboard' && (
            <div className="animate-in fade-in">
              <h2 className="text-2xl font-bold mb-4">Dashboard Santunan Jaya</h2>
              {!db && <div className="mb-4 bg-orange-100 text-orange-800 p-3 rounded-lg text-sm border border-orange-200">Firebase belum terhubung. Ini mode simulasi.</div>}
              {db && <div className="mb-4 bg-emerald-100 text-emerald-800 p-3 rounded-lg text-sm border border-emerald-200 font-medium">Database Firebase Terhubung Aktif.</div>}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"><p className="text-gray-500 text-sm mb-1">Total Warga</p><h3 className="text-3xl font-bold text-gray-800">{dataWarga.length} <span className="text-sm font-normal">KK</span></h3></div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"><p className="text-gray-500 text-sm mb-1">Saldo Kas</p><h3 className="text-2xl font-bold text-emerald-600">Rp {saldoAkhir.toLocaleString('id-ID')}</h3></div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"><p className="text-gray-500 text-sm mb-1">Laporan Masuk</p><h3 className="text-3xl font-bold text-orange-500">{laporanWarga.length}</h3></div>
              </div>
            </div>
          )}

          {adminMenu === 'kelola_warga' && (
            <div className="animate-in fade-in space-y-6">
              <h2 className="text-2xl font-bold">Kelola Data Warga</h2>
              <div className="bg-white p-5 rounded-xl border shadow-sm">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Plus size={18}/> Tambah Warga Baru</h3>
                <form onSubmit={tambahWarga} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
                  <div className="lg:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Nama Kepala Keluarga</label>
                    <input type="text" required value={newWarga.nama} onChange={e=>setNewWarga({...newWarga, nama: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg outline-none" placeholder="Nama..." />
                  </div>
                  <div className="lg:col-span-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Jalan</label>
                    <select value={newWarga.jalan} onChange={e=>setNewWarga({...newWarga, jalan: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg bg-white outline-none">
                      <option>Jl. Santunan 1</option><option>Jl. Santunan 2</option><option>Jl. Santunan 3</option><option>Jl. Santunan 4</option><option>Jl. Pengairan</option>
                    </select>
                  </div>
                  <div className="lg:col-span-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">No Rumah</label>
                    <input type="text" required value={newWarga.noRumah} onChange={e=>setNewWarga({...newWarga, noRumah: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg outline-none" placeholder="No..." />
                  </div>
                  <div className="lg:col-span-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                    <select value={newWarga.status} onChange={e=>setNewWarga({...newWarga, status: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg bg-white outline-none">
                      <option>Penetap</option><option>Pendatang</option>
                    </select>
                  </div>
                  <button type="submit" className="bg-emerald-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-emerald-700 text-sm h-[38px] lg:col-span-1">Simpan</button>
                </form>
              </div>

              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b text-sm"><tr><th className="p-4">Nama</th><th className="p-4">Alamat</th><th className="p-4">Status</th><th className="p-4 text-right">Aksi</th></tr></thead>
                  <tbody>
                    {dataWarga.map((w) => (
                      <tr key={w.id} className="border-b text-sm"><td className="p-4 font-medium">{w.nama}</td><td className="p-4">{w.jalan} No. {w.noRumah}</td>
                        <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${w.status === 'Penetap' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{w.status}</span></td>
                        <td className="p-4 text-right"><button onClick={() => hapusWarga(w.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2 size={16}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {adminMenu === 'kelola_kas' && (
             <div className="animate-in fade-in space-y-6">
               <h2 className="text-2xl font-bold">Kelola Kas</h2>
               <div className="bg-white p-5 rounded-xl border shadow-sm">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Plus size={18}/> Catat Transaksi Baru</h3>
                <form onSubmit={tambahKas} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                  <div><label className="block text-xs font-medium mb-1">Tanggal</label><input type="text" required value={newKas.tanggal} onChange={e=>setNewKas({...newKas, tanggal: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg" placeholder="Cth: 20 Mei 2026" /></div>
                  <div className="lg:col-span-2"><label className="block text-xs font-medium mb-1">Keterangan</label><input type="text" required value={newKas.keterangan} onChange={e=>setNewKas({...newKas, keterangan: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg" placeholder="Deskripsi..." /></div>
                  <div><label className="block text-xs font-medium mb-1">Masuk (Rp)</label><input type="number" value={newKas.masuk} onChange={e=>setNewKas({...newKas, masuk: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg" /></div>
                  <div><label className="block text-xs font-medium mb-1">Keluar (Rp)</label><input type="number" value={newKas.keluar} onChange={e=>setNewKas({...newKas, keluar: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg" /></div>
                  <div className="lg:col-span-5 flex justify-end"><button type="submit" className="bg-emerald-600 text-white font-medium py-2 px-6 rounded-lg">Tambah Catatan</button></div>
                </form>
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-4 overflow-x-auto">
                <table className="w-full text-left text-sm mt-4">
                  <thead><tr className="border-b"><th className="pb-2">Tgl</th><th className="pb-2">Keterangan</th><th className="pb-2 text-right">Masuk</th><th className="pb-2 text-right">Keluar</th><th className="pb-2 text-center">Aksi</th></tr></thead>
                  <tbody>{laporanKas.map(k => (
                    <tr key={k.id} className="border-b">
                      <td className="py-2">{k.tanggal}</td>
                      <td>{k.keterangan}</td>
                      <td className="text-right text-emerald-600">{k.masuk > 0 ? k.masuk.toLocaleString('id-ID') : '-'}</td>
                      <td className="text-right text-red-500">{k.keluar > 0 ? k.keluar.toLocaleString('id-ID') : '-'}</td>
                      <td className="text-center">
                        <button 
                          onClick={() => hapusKas(k.id, k.tanggal, k.keterangan)} 
                          className="text-red-500 hover:bg-red-50 p-1 rounded-lg"
                          title="Hapus catatan kas"
                        >
                          <Trash2 size={16}/>
                        </button>
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
             </div>
          )}

          {adminMenu === 'kelola_pengumuman' && (
             <div className="animate-in fade-in space-y-6">
               <h2 className="text-2xl font-bold">Kelola Pengumuman</h2>
               <div className="bg-white p-5 rounded-xl border shadow-sm">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Megaphone size={18}/> Buat Pengumuman Baru</h3>
                <form onSubmit={tambahPengumuman} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2"><label className="block text-xs font-medium mb-1">Judul Pengumuman</label><input type="text" required value={newPengumuman.judul} onChange={e=>setNewPengumuman({...newPengumuman, judul: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg" /></div>
                    <div><label className="block text-xs font-medium mb-1">Tipe Label</label>
                      <select value={newPengumuman.tipe} onChange={e=>setNewPengumuman({...newPengumuman, tipe: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg bg-white">
                        <option value="info">Info (Hijau)</option><option value="alert">Penting (Merah)</option><option value="event">Acara (Biru)</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div><label className="block text-xs font-medium mb-1">Tanggal/Waktu</label><input type="text" required value={newPengumuman.tanggal} onChange={e=>setNewPengumuman({...newPengumuman, tanggal: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg" placeholder="Cth: 15 Agustus 2026" /></div>
                     <div className="md:col-span-2"><label className="block text-xs font-medium mb-1">Isi Pesan Pendek</label><input type="text" required value={newPengumuman.deskripsi} onChange={e=>setNewPengumuman({...newPengumuman, deskripsi: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg" /></div>
                  </div>
                  {/* INPUT LINK BARU */}
                  <div>
                    <label className="block text-xs font-medium mb-1">Link (opsional)</label>
                    <input 
                      type="url" 
                      value={newPengumuman.link} 
                      onChange={e=>setNewPengumuman({...newPengumuman, link: e.target.value})} 
                      className="w-full px-3 py-2 text-sm border rounded-lg" 
                      placeholder="https://..."
                    />
                  </div>
                  <button type="submit" className="bg-emerald-600 text-white font-medium py-2 px-6 rounded-lg">Publish Pengumuman</button>
                </form>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pengumuman.map(p => (
                   <div key={p.id} className="bg-white border rounded-xl p-4 flex justify-between items-start">
                     <div className="flex-1">
                       <span className="text-[10px] bg-gray-100 px-2 py-1 rounded font-bold uppercase">{p.tipe}</span>
                       <h4 className="font-bold text-gray-900 mt-2">{p.judul}</h4>
                       <p className="text-xs text-gray-500 mb-2">{p.tanggal}</p>
                       <p className="text-sm text-gray-700">{p.deskripsi}</p>
                       {p.link && (
                         <a 
                           href={p.link} 
                           target="_blank" 
                           rel="noopener noreferrer" 
                           className="text-sm text-emerald-600 hover:underline flex items-center gap-1 mt-2"
                         >
                           <ExternalLink size={14}/> Buka Link
                         </a>
                       )}
                     </div>
                     <button onClick={() => hapusPengumuman(p.id)} className="text-red-500 bg-red-50 p-2 rounded-lg hover:bg-red-100 ml-4"><Trash2 size={16}/></button>
                   </div>
                ))}
              </div>
             </div>
          )}

           {adminMenu === 'kelola_laporan' && (
            <div className="animate-in fade-in space-y-6">
              <h2 className="text-2xl font-bold">Log Laporan & Aspirasi</h2>
              <div className="space-y-4">
                {laporanWarga.length === 0 ? <p className="text-gray-500 bg-white p-4 rounded border text-center">Belum ada laporan dari warga.</p> : null}
                {laporanWarga.map(lap => (
                  <div key={lap.id} className="bg-white p-5 rounded-xl border shadow-sm flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex gap-2 items-center mb-1">
                          <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded">{lap.kategori}</span>
                          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">{lap.status || 'Menunggu'}</span>
                          <span className="text-xs text-gray-500">{lap.jalan}</span>
                        </div>
                        <p className="font-medium text-gray-900 mt-2 text-lg">{lap.pesan}</p>
                        <p className="text-sm text-gray-600 mt-1"><UserCog size={14} className="inline mr-1"/>Pelapor: <strong>{lap.nama}</strong></p>
                      </div>
                      <button onClick={() => hapusLaporan(lap.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={18}/></button>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-2">
                       <label className="block text-xs font-bold text-gray-700 mb-2">Tanggapan/Catatan Admin:</label>
                       <textarea 
                         className="w-full text-sm p-2 border rounded outline-none focus:border-emerald-500 mb-2" rows="2"
                         placeholder={lap.catatanAdmin ? lap.catatanAdmin : "Tulis balasan atau progres laporan..."}
                         value={catatanInput[lap.id] !== undefined ? catatanInput[lap.id] : (lap.catatanAdmin || '')}
                         onChange={(e) => setCatatanInput({...catatanInput, [lap.id]: e.target.value})}
                       ></textarea>
                       <div className="flex gap-2">
                         <button onClick={() => updateLaporan(lap.id, 'Diproses')} className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1"><Edit size={14}/> Tandai Diproses</button>
                         <button onClick={() => updateLaporan(lap.id, 'Selesai')} className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1"><Check size={14}/> Tandai Selesai</button>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {adminMenu === 'pengaturan_sistem' && isSuperAdmin && (
             <div className="animate-in fade-in space-y-6">
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                  <h2 className="text-xl font-bold text-purple-900 mb-2 flex items-center gap-2"><Lock /> Kelola Akun Admin (Super Admin)</h2>
                  <p className="text-purple-800 text-sm mb-6">Tambah pengurus baru, ubah password, atau hapus akses admin.</p>
                  
                  <div className="bg-white p-4 rounded-xl border border-purple-100 mb-6 shadow-sm">
                    <h3 className="font-bold text-sm text-purple-900 mb-3">{formPengurus.id ? 'Edit Data / Password Akun' : 'Tambah Akun Baru'}</h3>
                    <form onSubmit={simpanPengurus} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="block text-xs font-medium mb-1">Nama Lengkap / Jabatan</label><input type="text" required value={formPengurus.nama} onChange={e=>setFormPengurus({...formPengurus, nama: e.target.value})} className="w-full px-3 py-2 text-sm border rounded focus:border-purple-500 outline-none" placeholder="Cth: Bendahara RT"/></div>
                      <div><label className="block text-xs font-medium mb-1">Username Login</label><input type="text" required value={formPengurus.username} onChange={e=>setFormPengurus({...formPengurus, username: e.target.value})} className="w-full px-3 py-2 text-sm border rounded focus:border-purple-500 outline-none"/></div>
                      <div><label className="block text-xs font-medium mb-1">Password Baru</label><input type="text" required value={formPengurus.password} onChange={e=>setFormPengurus({...formPengurus, password: e.target.value})} className="w-full px-3 py-2 text-sm border rounded focus:border-purple-500 outline-none" placeholder="Buat password..."/></div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Hak Akses</label>
                        <select value={formPengurus.role} onChange={e=>setFormPengurus({...formPengurus, role: e.target.value})} className="w-full px-3 py-2 text-sm border rounded bg-white outline-none">
                          <option value="admin_biasa">Admin Biasa</option><option value="super_admin">Super Admin</option>
                        </select>
                      </div>
                      <div className="md:col-span-2 flex gap-2">
                        <button type="submit" className="bg-purple-600 text-white text-sm font-bold px-4 py-2 rounded hover:bg-purple-700">Simpan Akun</button>
                        {formPengurus.id && <button type="button" onClick={() => setFormPengurus({id:null, username:'', password:'', role:'admin_biasa', nama:''})} className="bg-gray-200 text-gray-700 text-sm font-bold px-4 py-2 rounded">Batal Edit</button>}
                      </div>
                    </form>
                  </div>

                  <h3 className="font-bold text-sm text-purple-900 mb-3">Daftar Pengurus Terdaftar:</h3>
                  <div className="space-y-2">
                    {pengurus.map((u) => (
                      <div key={u.id} className="bg-white p-3 rounded-lg border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                        <div>
                          <strong className="text-gray-800">{u.nama}</strong> <span className="text-gray-500">(@{u.username})</span>
                          <p className="text-xs text-purple-600 mt-1">Pass: {u.password}</p> 
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${u.role === 'super_admin' ? 'bg-purple-200 text-purple-800' : 'bg-gray-100 text-gray-600'}`}>{u.role}</span>
                          <button onClick={() => editPengurus(u)} className="text-blue-500 hover:bg-blue-50 p-1 rounded" title="Edit Data/Password"><Edit size={16}/></button>
                          <button onClick={() => hapusPengurus(u.id)} className="text-red-500 hover:bg-red-50 p-1 rounded" title="Hapus Akses"><Trash2 size={16}/></button>
                        </div>
                      </div>
                    ))}
                    {pengurus.length === 0 && <p className="text-sm text-gray-500 bg-white p-3 rounded">Belum ada data pengurus di Database.</p>}
                  </div>
                </div>
             </div>
          )}
        </div>
      </div>
    );
  };

  const renderPublicView = () => {
    const filteredWarga = dataWarga.filter(warga => 
      warga.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      warga.jalan.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const navItems = [
      { id: 'beranda', label: 'Beranda', icon: <Home size={18} /> },
      { id: 'data_warga', label: 'Data Warga', icon: <MapPin size={18} /> },
      { id: 'layanan', label: 'Layanan', icon: <FileText size={18} /> },
      { id: 'keuangan', label: 'Kas RT', icon: <Wallet size={18} /> },
      { id: 'kontak', label: 'Lapor', icon: <Phone size={18} /> },
    ];

    const submitLaporan = async (e) => {
      e.preventDefault();
      const lapBaru = { ...formLapor, status: 'Menunggu', catatanAdmin: '' };
      if (db) await addDoc(collection(db, "laporan"), lapBaru);
      setFormLapor({ nama: '', jalan: 'Jl. Santunan 1', pesan: '', kategori: 'Fasilitas Umum' });
      showNotification("Laporan berhasil dikirim! Silakan pantau Log di bawah.");
    };

    return (
      <>
        {/* Navbar Public */}
        <nav className="bg-emerald-700 text-white shadow-lg sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <span className="font-bold text-xl tracking-tight flex items-center gap-2">
                  <Users className="text-emerald-300" /> Portal Santunan Jaya
                </span>
              </div>
              <div className="hidden lg:flex items-center space-x-2">
                {navItems.map((item) => (
                  <button key={item.id} onClick={() => navigateTo(item.id)} className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === item.id ? 'bg-emerald-800 text-white' : 'hover:bg-emerald-600'}`}>
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>
              <div className="lg:hidden flex items-center">
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-md hover:bg-emerald-600 focus:outline-none">
                  {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>
          </div>
          {isMobileMenuOpen && (
            <div className="lg:hidden bg-emerald-800 pb-3 pt-2">
              {navItems.map((item) => (
                <button key={item.id} onClick={() => navigateTo(item.id)} className={`flex items-center gap-2 w-full text-left px-4 py-3 text-base border-b border-emerald-700 ${activeTab === item.id ? 'bg-emerald-900 text-white' : 'text-emerald-100 hover:bg-emerald-700'}`}>
                  {item.icon} {item.label}
                </button>
              ))}
            </div>
          )}
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-140px)]">
          
          {activeTab === 'beranda' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl shadow-xl overflow-hidden">
                <div className="px-6 py-12 md:p-16 text-center text-white">
                  <h1 className="text-3xl md:text-5xl font-extrabold mb-4">Selamat Datang di Portal Santunan Jaya</h1>
                  <p className="text-lg md:text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
                    Website resmi Rukun Tetangga (RT) 07 / RW 01, Desa Mangunjaya, Kecamatan Tambun Selatan, Provinsi Jawa Barat.
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button onClick={() => navigateTo('data_warga')} className="bg-white text-emerald-700 hover:bg-gray-100 font-bold py-3 px-6 rounded-full shadow-md transition-transform hover:scale-105 flex justify-center items-center gap-2">
                      Lihat Data Warga <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-800 border-l-4 border-emerald-500 pl-3 mb-6">Pengumuman Terbaru</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pengumuman.length === 0 ? <p className="text-gray-500">Tidak ada pengumuman saat ini.</p> : null}
                  {pengumuman.map(p => (
                    <div key={p.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                      <div className="flex items-center gap-2 mb-3">
                        {p.tipe === 'alert' ? <AlertCircle className="text-red-500" size={20}/> : p.tipe === 'event' ? <Calendar className="text-blue-500" size={20}/> : <Bell className="text-emerald-500" size={20}/>}
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full font-semibold text-gray-600">{p.tanggal}</span>
                      </div>
                      <h3 className="font-bold mb-2 text-lg text-gray-900">{p.judul}</h3>
                      <p className="text-gray-600 text-sm">{p.deskripsi}</p>
                      {p.link && (
                        <a 
                          href={p.link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:underline mt-3"
                        >
                          <ExternalLink size={14}/> Kunjungi Link
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data_warga' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <h2 className="text-3xl font-bold text-gray-800">Data Wilayah & Warga</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                {['Jl. Santunan 1', 'Jl. Santunan 2', 'Jl. Santunan 3', 'Jl. Santunan 4', 'Jl. Pengairan'].map((jalan, idx) => (
                  <div key={idx} className={`rounded-xl p-4 shadow-sm border ${jalan === 'Jl. Pengairan' ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <HomeIcon size={16} className={jalan === 'Jl. Pengairan' ? 'text-orange-500' : 'text-emerald-500'} />
                      <h3 className="font-semibold text-sm text-gray-800">{jalan}</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{rekapJalan[jalan] || 0} <span className="text-sm font-normal text-gray-500">KK</span></p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-center gap-4">
                  <h3 className="font-bold text-lg">Daftar Warga Santunan Jaya</h3>
                  <div className="relative w-full sm:w-64">
                    <input type="text" placeholder="Cari nama atau jalan..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 outline-none text-sm" />
                    <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b"><tr className="text-sm text-gray-600"><th className="p-4">Nama</th><th className="p-4">Jalan</th><th className="p-4">No.</th><th className="p-4">Status</th></tr></thead>
                    <tbody>
                      {filteredWarga.map((w) => (
                        <tr key={w.id} className="border-b text-sm"><td className="p-4 font-medium text-gray-900">{w.nama}</td><td className="p-4">{w.jalan}</td><td className="p-4">{w.noRumah}</td>
                        <td className="p-4"><span className={`px-2 py-1 bg-gray-100 rounded-full text-xs font-semibold ${w.status === 'Penetap' ? 'text-emerald-700 bg-emerald-50' : 'text-blue-700 bg-blue-50'}`}>{w.status}</span></td></tr>
                      ))}
                      {filteredWarga.length === 0 && <tr><td colSpan="4" className="p-6 text-center text-gray-500">Data tidak ditemukan.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'keuangan' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <h2 className="text-3xl font-bold">Laporan Kas RT 07</h2>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 inline-flex items-center gap-4 mb-4">
                <Wallet className="text-emerald-600" size={32} />
                <div><p className="text-sm text-emerald-800">Saldo Akhir</p><p className="text-2xl font-bold text-emerald-900">Rp {saldoAkhir.toLocaleString('id-ID')}</p></div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left"><thead className="bg-gray-50 border-b"><tr className="text-sm"><th className="p-4">Tgl</th><th className="p-4">Keterangan</th><th className="p-4 text-right">Masuk</th><th className="p-4 text-right">Keluar</th></tr></thead>
                  <tbody>
                    {laporanKas.map(k => (
                      <tr key={k.id} className="border-b text-sm"><td className="p-4">{k.tanggal}</td><td className="p-4">{k.keterangan}</td><td className="p-4 text-right text-emerald-600 font-medium">{k.masuk > 0 ? '+ ' + k.masuk.toLocaleString('id-ID') : '-'}</td><td className="p-4 text-right text-red-500 font-medium">{k.keluar > 0 ? '- ' + k.keluar.toLocaleString('id-ID') : '-'}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'kontak' && (
            <div className="max-w-3xl mx-auto animate-in fade-in space-y-12">
              <div>
                <h2 className="text-3xl font-bold text-center mb-8">Lapor & Aspirasi</h2>
                <form className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 space-y-4" onSubmit={submitLaporan}>
                  <div><label className="block text-sm font-medium mb-1">Nama Pelapor</label><input required value={formLapor.nama} onChange={e=>setFormLapor({...formLapor, nama: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Nama Anda..."/></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Lokasi Kejadian / Alamat</label>
                      <select value={formLapor.jalan} onChange={e=>setFormLapor({...formLapor, jalan: e.target.value})} className="w-full p-2.5 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500">
                        <option>Jl. Santunan 1</option><option>Jl. Santunan 2</option><option>Jl. Santunan 3</option><option>Jl. Santunan 4</option><option>Jl. Pengairan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Kategori</label>
                      <select value={formLapor.kategori} onChange={e=>setFormLapor({...formLapor, kategori: e.target.value})} className="w-full p-2.5 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500">
                        <option>Fasilitas Umum</option><option>Keamanan</option><option>Kebersihan</option><option>Lainnya</option>
                      </select>
                    </div>
                  </div>
                  <div><label className="block text-sm font-medium mb-1">Isi Laporan</label><textarea required rows="3" value={formLapor.pesan} onChange={e=>setFormLapor({...formLapor, pesan: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 resize-none" placeholder="Deskripsikan masalah..."></textarea></div>
                  <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 shadow-md">Kirim Laporan</button>
                </form>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4 border-l-4 border-emerald-500 pl-3">Log Riwayat Laporan</h3>
                <div className="space-y-4">
                  {laporanWarga.length === 0 ? <p className="text-gray-500">Belum ada laporan tercatat.</p> : null}
                  {laporanWarga.map(lap => (
                    <div key={lap.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                           <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-1 rounded uppercase mr-2">{lap.kategori}</span>
                           <span className="text-xs text-gray-500">{lap.jalan}</span>
                           <h4 className="font-semibold text-gray-900 mt-2">{lap.pesan}</h4>
                           <p className="text-xs text-gray-500 mt-1">Pelapor: {lap.nama}</p>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${lap.status === 'Selesai' ? 'bg-emerald-100 text-emerald-700' : lap.status === 'Diproses' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                          {lap.status || 'Menunggu'}
                        </span>
                      </div>
                      
                      {lap.catatanAdmin && (
                        <div className="bg-emerald-50 border border-emerald-100 rounded p-3 mt-2">
                          <p className="text-xs font-bold text-emerald-800 mb-1 flex items-center gap-1"><CheckCircle size={12}/> Tanggapan Pengurus:</p>
                          <p className="text-sm text-emerald-900">{lap.catatanAdmin}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'layanan' && (
            <div className="animate-in fade-in space-y-4">
              <h2 className="text-3xl font-bold mb-4">Layanan Administrasi</h2>
              <div className="bg-white p-6 rounded-xl border shadow-sm"><h3 className="font-bold flex items-center gap-2 text-lg mb-2"><FileCheck className="text-emerald-500"/> Surat Pengantar RT/RW</h3><p className="text-sm text-gray-600">Persyaratan: Bawa KTP asli pemohon dan Fotokopi Kartu Keluarga (KK). Datang langsung ke rumah Ketua RT atau Sekretaris.</p></div>
            </div>
          )}
        </main>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col">
      {renderNotificationBar()}
      
      {showLogin && renderLoginModal()}

      {isAdminMode ? (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
          {renderAdminDashboard()}
        </main>
      ) : (
        renderPublicView()
      )}

      <footer className="bg-gray-900 text-gray-400 py-6 text-center mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-3">
          <p>© 2026 Portal Santunan Jaya. RT 07 / RW 01 Desa Mangunjaya, Kec. Tambun Selatan, Jawa Barat.</p>
          {!isAdminMode && (
            <button onClick={() => setShowLogin(true)} className="text-xs flex items-center gap-1 text-gray-500 hover:text-white transition-colors">
              <Lock size={12} /> Login Pengurus (Admin/Super Admin)
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}