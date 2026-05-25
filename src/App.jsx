import React, { useState, useEffect } from 'react';
import { 
  Home, Users, Bell, FileText, Phone, Menu, X, 
  Wallet, ChevronRight, FileCheck, AlertCircle, Calendar,
  MapPin, Home as HomeIcon, Search, Lock, LogOut, Edit, Trash2, Plus, CheckCircle
} from 'lucide-react';

// === IMPORT FIREBASE ===
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';

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

// Inisialisasi Firebase (Dengan perlindungan jika belum diisi)
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

  // --- ADMIN DASHBOARD STATES ---
  const [adminMenu, setAdminMenu] = useState('dashboard');
  const [newWarga, setNewWarga] = useState({ nama: '', jalan: 'Jl. Santunan 1', noRumah: '', status: 'Tetap' });
  const [newKas, setNewKas] = useState({ tanggal: '', keterangan: '', masuk: 0, keluar: 0 });

  // --- PUBLIC VIEW STATES ---
  const [searchQuery, setSearchQuery] = useState('');
  const [formLapor, setFormLapor] = useState({ nama: '', jalan: 'Jl. Santunan 1', pesan: '', kategori: 'Fasilitas Umum' });

  // Simulasi tabel pengguna (Akun Admin)
  const usersDB = [
    { username: 'superadmin', password: '123', role: 'super_admin', nama: 'Ketua RT 07' },
    { username: 'admin', password: '123', role: 'admin_biasa', nama: 'Sekretaris/Bendahara' }
  ];

  // ==========================================
  // EFEK SINKRONISASI FIREBASE
  // ==========================================
  useEffect(() => {
    if (!db) {
      // Menampilkan data simulasi jika Firebase belum diatur
      setDataWarga([
        { id: 1, nama: 'Bpk. Ahmad Budi', jalan: 'Jl. Santunan 1', noRumah: '1A', status: 'Tetap' },
        { id: 2, nama: 'Ibu Siti Aminah', jalan: 'Jl. Santunan 1', noRumah: '1B', status: 'Tetap' },
        { id: 3, nama: 'Bpk. Doni Setiawan', jalan: 'Jl. Santunan 2', noRumah: '5', status: 'Tetap' },
        { id: 4, nama: 'Sdr. Bima (Kost)', jalan: 'Jl. Santunan 3', noRumah: '10', status: 'Pendatang' },
        { id: 5, nama: 'Bpk. Anton (Toko)', jalan: 'Jl. Pengairan', noRumah: '99', status: 'Diluar RT' },
      ]);
      setLaporanKas([
        { id: 1, tanggal: '01 Mei 2026', keterangan: 'Iuran Warga Bulan Mei', masuk: 1500000, keluar: 0 },
        { id: 2, tanggal: '05 Mei 2026', keterangan: 'Pembayaran Petugas Sampah', masuk: 0, keluar: 300000 },
        { id: 3, tanggal: '10 Mei 2026', keterangan: 'Perbaikan Lampu Jalan Gang 2', masuk: 0, keluar: 150000 },
      ]);
      setLaporanWarga([
        { id: 1, nama: 'Bpk. Budi', jalan: 'Jl. Santunan 1', kategori: 'Fasilitas Umum', pesan: 'Lampu jalan mati di depan nomor 1A', status: 'Menunggu' }
      ]);
      return;
    }

    // Mengambil Data dari Firebase secara realtime
    const unsubWarga = onSnapshot(collection(db, "warga"), snapshot => {
      setDataWarga(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubKas = onSnapshot(collection(db, "kas"), snapshot => {
      setLaporanKas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubLapor = onSnapshot(collection(db, "laporan"), snapshot => {
      setLaporanWarga(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubWarga(); unsubKas(); unsubLapor(); };
  }, []);

  // --- LOGIC AUTHENTICATION ---
  const handleLogin = (e) => {
    e.preventDefault();
    const user = usersDB.find(u => u.username === loginForm.username && u.password === loginForm.password);
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
            <strong>Petunjuk Login:</strong><br/>
            Super Admin: <code>superadmin</code> / <code>123</code><br/>
            Admin Biasa: <code>admin</code> / <code>123</code>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input 
              type="text" required
              value={loginForm.username}
              onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" required
              value={loginForm.password}
              onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>
          <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition-colors">
            Masuk
          </button>
        </form>
      </div>
    </div>
  );

  const renderAdminDashboard = () => {
    const isSuperAdmin = currentUser?.role === 'super_admin';

    const hapusWarga = async (id) => {
      if (db) await deleteDoc(doc(db, "warga", id));
      else setDataWarga(dataWarga.filter(w => w.id !== id));
      showNotification('Data warga berhasil dihapus.');
    };

    const tambahWarga = async (e) => {
      e.preventDefault();
      if (db) await addDoc(collection(db, "warga"), newWarga);
      else setDataWarga([...dataWarga, { ...newWarga, id: Date.now() }]);
      
      setNewWarga({ nama: '', jalan: 'Jl. Santunan 1', noRumah: '', status: 'Tetap' });
      showNotification('Warga baru berhasil ditambahkan.');
    };

    const tambahKas = async (e) => {
      e.preventDefault();
      const kasBaru = { ...newKas, masuk: Number(newKas.masuk), keluar: Number(newKas.keluar) };
      
      if (db) await addDoc(collection(db, "kas"), kasBaru);
      else setLaporanKas([...laporanKas, { ...kasBaru, id: Date.now() }]);

      setNewKas({ tanggal: '', keterangan: '', masuk: 0, keluar: 0 });
      showNotification('Data kas berhasil ditambahkan.');
    };

    const selesaikanLaporan = async (id) => {
      if (db) await deleteDoc(doc(db, "laporan", id));
      else setLaporanWarga(laporanWarga.filter(l => l.id !== id));
      showNotification('Laporan ditandai selesai.');
    };

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
                { id: 'kelola_kas', label: 'Kelola Kas RT', icon: <Wallet size={18}/> },
                { id: 'kelola_laporan', label: 'Laporan Warga', icon: <AlertCircle size={18}/> },
              ].map(menu => (
                <button
                  key={menu.id} onClick={() => setAdminMenu(menu.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left ${adminMenu === menu.id ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {menu.icon} {menu.label}
                </button>
              ))}
              
              {/* SUPER ADMIN ONLY MENU */}
              {isSuperAdmin && (
                <button
                  onClick={() => setAdminMenu('pengaturan_sistem')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left mt-4 border-t border-gray-100 ${adminMenu === 'pengaturan_sistem' ? 'bg-purple-50 text-purple-700' : 'text-purple-600 hover:bg-purple-50'}`}
                >
                  <Lock size={18}/> Pengaturan Sistem
                </button>
              )}

              <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 text-left mt-4">
                <LogOut size={18}/> Keluar (Logout)
              </button>
            </div>
          </div>
        </div>

        {/* Admin Content Area */}
        <div className="flex-1 space-y-6">
          
          {/* Dashboard Summary */}
          {adminMenu === 'dashboard' && (
            <div className="animate-in fade-in">
              <h2 className="text-2xl font-bold mb-4">Ringkasan Sistem RT 07/01</h2>
              {!db && <div className="mb-4 bg-orange-100 text-orange-800 p-3 rounded-lg text-sm border border-orange-200"><strong>Perhatian:</strong> Firebase belum terhubung. Data ini hanya simulasi sementara.</div>}
              {db && <div className="mb-4 bg-emerald-100 text-emerald-800 p-3 rounded-lg text-sm border border-emerald-200 font-medium">Database Firebase Terhubung Aktif.</div>}
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-gray-500 text-sm mb-1">Total Warga Terdata</p>
                  <h3 className="text-3xl font-bold text-gray-800">{dataWarga.length} <span className="text-sm font-normal">KK</span></h3>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-gray-500 text-sm mb-1">Saldo Kas Saat Ini</p>
                  <h3 className="text-2xl font-bold text-emerald-600">Rp {saldoAkhir.toLocaleString('id-ID')}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-gray-500 text-sm mb-1">Laporan Menunggu</p>
                  <h3 className="text-3xl font-bold text-orange-500">{laporanWarga.length}</h3>
                </div>
              </div>
            </div>
          )}

          {/* Kelola Warga */}
          {adminMenu === 'kelola_warga' && (
            <div className="animate-in fade-in space-y-6">
              <h2 className="text-2xl font-bold">Kelola Data Warga</h2>
              
              {/* Form Tambah Warga */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Plus size={18}/> Tambah Warga Baru</h3>
                <form onSubmit={tambahWarga} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                  <div className="lg:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Nama Kepala Keluarga</label>
                    <input type="text" required value={newWarga.nama} onChange={e=>setNewWarga({...newWarga, nama: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:border-emerald-500" placeholder="Nama..." />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Jalan</label>
                    <select value={newWarga.jalan} onChange={e=>setNewWarga({...newWarga, jalan: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg outline-none bg-white">
                      <option>Jl. Santunan 1</option><option>Jl. Santunan 2</option><option>Jl. Santunan 3</option><option>Jl. Santunan 4</option><option>Jl. Pengairan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">No Rumah</label>
                    <input type="text" required value={newWarga.noRumah} onChange={e=>setNewWarga({...newWarga, noRumah: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:border-emerald-500" placeholder="No..." />
                  </div>
                  <button type="submit" className="bg-emerald-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-emerald-700 text-sm h-[38px]">
                    Simpan
                  </button>
                </form>
              </div>

              {/* Tabel Admin Warga */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-200 text-sm">
                    <tr><th className="p-4">Nama</th><th className="p-4">Alamat</th><th className="p-4">Status</th><th className="p-4 text-right">Aksi</th></tr>
                  </thead>
                  <tbody>
                    {dataWarga.map((warga) => (
                      <tr key={warga.id} className="border-b border-gray-100 text-sm">
                        <td className="p-4 font-medium">{warga.nama}</td>
                        <td className="p-4 text-gray-600">{warga.jalan} No. {warga.noRumah}</td>
                        <td className="p-4"><span className="px-2 py-1 bg-gray-100 rounded-full text-xs">{warga.status}</span></td>
                        <td className="p-4 text-right">
                          <button onClick={() => hapusWarga(warga.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg" title="Hapus"><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Kelola Kas */}
          {adminMenu === 'kelola_kas' && (
            <div className="animate-in fade-in space-y-6">
              <h2 className="text-2xl font-bold">Kelola Kas RT</h2>
              
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Plus size={18}/> Catat Transaksi Baru</h3>
                <form onSubmit={tambahKas} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Tanggal</label>
                    <input type="text" required value={newKas.tanggal} onChange={e=>setNewKas({...newKas, tanggal: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg outline-none" placeholder="Cth: 20 Mei 2026" />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Keterangan</label>
                    <input type="text" required value={newKas.keterangan} onChange={e=>setNewKas({...newKas, keterangan: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg outline-none" placeholder="Deskripsi..." />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Pemasukan (Rp)</label>
                    <input type="number" value={newKas.masuk} onChange={e=>setNewKas({...newKas, masuk: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Pengeluaran (Rp)</label>
                    <input type="number" value={newKas.keluar} onChange={e=>setNewKas({...newKas, keluar: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg outline-none" />
                  </div>
                  <div className="lg:col-span-5 flex justify-end">
                    <button type="submit" className="bg-emerald-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-emerald-700 text-sm">Tambah Catatan</button>
                  </div>
                </form>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 overflow-x-auto">
                <table className="w-full text-left text-sm mt-4">
                  <thead><tr className="border-b"><th className="pb-2">Tgl</th><th className="pb-2">Keterangan</th><th className="pb-2 text-right">Masuk</th><th className="pb-2 text-right">Keluar</th></tr></thead>
                  <tbody>
                    {laporanKas.map(k => (
                      <tr key={k.id} className="border-b border-gray-100">
                        <td className="py-2">{k.tanggal}</td><td>{k.keterangan}</td>
                        <td className="text-right text-emerald-600">{k.masuk > 0 ? k.masuk.toLocaleString('id-ID') : '-'}</td>
                        <td className="text-right text-red-500">{k.keluar > 0 ? k.keluar.toLocaleString('id-ID') : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

           {/* Kelola Laporan */}
           {adminMenu === 'kelola_laporan' && (
            <div className="animate-in fade-in">
              <h2 className="text-2xl font-bold mb-6">Laporan Masuk dari Warga</h2>
              <div className="space-y-4">
                {laporanWarga.length === 0 ? <p className="text-gray-500">Belum ada laporan.</p> : null}
                {laporanWarga.map(lap => (
                  <div key={lap.id} className="bg-white p-5 rounded-xl border border-orange-200 shadow-sm flex flex-col md:flex-row justify-between gap-4">
                    <div>
                      <div className="flex gap-2 items-center mb-1">
                        <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded">{lap.kategori}</span>
                        <span className="text-xs text-gray-500">{lap.jalan}</span>
                      </div>
                      <p className="font-medium text-gray-900 mt-2">{lap.pesan}</p>
                      <p className="text-sm text-gray-600 mt-1">Pelapor: {lap.nama}</p>
                    </div>
                    <div className="flex items-center">
                      <button 
                        onClick={() => selesaikanLaporan(lap.id)}
                        className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Tandai Selesai
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pengaturan Sistem (Super Admin Only) */}
          {adminMenu === 'pengaturan_sistem' && isSuperAdmin && (
             <div className="animate-in fade-in">
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                  <h2 className="text-xl font-bold text-purple-900 mb-2 flex items-center gap-2"><Lock /> Area Super Admin</h2>
                  <p className="text-purple-800 text-sm mb-6">Di area ini, ketua RT dapat menambah admin baru, mereset password, dan mengelola pengaturan inti sistem.</p>
                  
                  <h3 className="font-bold text-sm text-purple-900 mb-3">Daftar Akses Pengurus Saat Ini:</h3>
                  <div className="space-y-2">
                    {usersDB.map((u, i) => (
                      <div key={i} className="bg-white p-3 rounded-lg border border-purple-100 flex justify-between items-center text-sm">
                        <div><strong className="text-gray-800">{u.nama}</strong> <span className="text-gray-500">(@{u.username})</span></div>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'super_admin' ? 'bg-purple-200 text-purple-800' : 'bg-gray-100 text-gray-600'}`}>{u.role}</span>
                      </div>
                    ))}
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
      const lapBaru = { ...formLapor, status: 'Menunggu' };
      if (db) await addDoc(collection(db, "laporan"), lapBaru);
      else setLaporanWarga([...laporanWarga, { ...lapBaru, id: Date.now() }]);
      
      setFormLapor({ nama: '', jalan: 'Jl. Santunan 1', pesan: '', kategori: 'Fasilitas Umum' });
      showNotification("Laporan berhasil dikirim ke Admin!");
    };

    return (
      <>
        {/* Navbar Public */}
        <nav className="bg-emerald-700 text-white shadow-lg sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <span className="font-bold text-xl tracking-tight flex items-center gap-2">
                  <Users className="text-emerald-300" /> RT 07 / RW 01
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

        {/* Main Content Public */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-140px)]">
          
          {/* BERANDA */}
          {activeTab === 'beranda' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl shadow-xl overflow-hidden">
                <div className="px-6 py-12 md:p-16 text-center text-white">
                  <h1 className="text-3xl md:text-5xl font-extrabold mb-4">Selamat Datang di Portal Warga</h1>
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
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"><div className="flex items-center gap-2 mb-3"><Bell className="text-emerald-500" size={20} /><span className="text-xs bg-gray-100 px-2 py-1 rounded-full">28 Mei 2026</span></div><h3 className="font-bold mb-2">Kerja Bakti Mingguan</h3><p className="text-gray-600 text-sm">Diharapkan kehadiran bapak-bapak membersihkan selokan.</p></div>
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"><div className="flex items-center gap-2 mb-3"><AlertCircle className="text-red-500" size={20} /><span className="text-xs bg-gray-100 px-2 py-1 rounded-full">Tiap Tanggal 5</span></div><h3 className="font-bold mb-2">Iuran Keamanan</h3><p className="text-gray-600 text-sm">Jangan lupa untuk pembayaran iuran bulanan.</p></div>
                </div>
              </div>
            </div>
          )}

          {/* DATA WARGA */}
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
                  <h3 className="font-bold text-lg">Daftar Warga (Realtime dari Admin)</h3>
                  <div className="relative w-full sm:w-64">
                    <input type="text" placeholder="Cari nama..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 outline-none text-sm" />
                    <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b"><tr className="text-sm text-gray-600"><th className="p-4">Nama</th><th className="p-4">Jalan</th><th className="p-4">No.</th><th className="p-4">Status</th></tr></thead>
                    <tbody>
                      {filteredWarga.map((w) => (
                        <tr key={w.id} className="border-b text-sm"><td className="p-4 font-medium">{w.nama}</td><td className="p-4">{w.jalan}</td><td className="p-4">{w.noRumah}</td><td className="p-4"><span className="px-2 py-1 bg-gray-100 rounded-full text-xs">{w.status}</span></td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* KEUANGAN */}
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
                      <tr key={k.id} className="border-b text-sm"><td className="p-4">{k.tanggal}</td><td className="p-4">{k.keterangan}</td><td className="p-4 text-right text-emerald-600">{k.masuk > 0 ? k.masuk.toLocaleString('id-ID') : '-'}</td><td className="p-4 text-right text-red-500">{k.keluar > 0 ? k.keluar.toLocaleString('id-ID') : '-'}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* LAPORAN WARGA */}
          {activeTab === 'kontak' && (
            <div className="max-w-2xl mx-auto animate-in fade-in">
              <h2 className="text-3xl font-bold text-center mb-8">Lapor & Aspirasi</h2>
              <form className="bg-white rounded-2xl shadow-sm border p-6 space-y-4" onSubmit={submitLaporan}>
                <div><label className="block text-sm mb-1">Nama</label><input required value={formLapor.nama} onChange={e=>setFormLapor({...formLapor, nama: e.target.value})} className="w-full p-2 border rounded" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Jalan</label>
                    <select value={formLapor.jalan} onChange={e=>setFormLapor({...formLapor, jalan: e.target.value})} className="w-full p-2 border rounded bg-white">
                      <option>Jl. Santunan 1</option><option>Jl. Santunan 2</option><option>Jl. Santunan 3</option><option>Jl. Santunan 4</option><option>Jl. Pengairan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Kategori</label>
                    <select value={formLapor.kategori} onChange={e=>setFormLapor({...formLapor, kategori: e.target.value})} className="w-full p-2 border rounded bg-white">
                      <option>Fasilitas Umum</option><option>Keamanan</option><option>Kebersihan</option><option>Lainnya</option>
                    </select>
                  </div>
                </div>
                <div><label className="block text-sm mb-1">Pesan</label><textarea required rows="3" value={formLapor.pesan} onChange={e=>setFormLapor({...formLapor, pesan: e.target.value})} className="w-full p-2 border rounded"></textarea></div>
                <button className="w-full bg-emerald-600 text-white font-bold py-3 rounded hover:bg-emerald-700">Kirim Laporan</button>
              </form>
            </div>
          )}

          {/* LAYANAN */}
          {activeTab === 'layanan' && (
            <div className="animate-in fade-in space-y-4">
              <h2 className="text-3xl font-bold mb-4">Layanan Administrasi RT 07</h2>
              <div className="bg-white p-6 rounded-xl border"><h3 className="font-bold flex items-center gap-2"><FileCheck className="text-emerald-500"/> Surat Pengantar RT/RW</h3><p className="text-sm text-gray-600 mt-2">Bawa KTP asli & Fotokopi KK ke rumah Ketua RT (Jl. Santunan 1 No 1A).</p></div>
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

      {/* Render based on Mode */}
      {isAdminMode ? (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
          {renderAdminDashboard()}
        </main>
      ) : (
        renderPublicView()
      )}

      {/* Footer selalu ada di bawah */}
      <footer className="bg-gray-900 text-gray-400 py-6 text-center mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-3">
          <p>© 2026 Portal Warga RT 07 / RW 01 Desa Mangunjaya, Kec. Tambun Selatan, Jawa Barat.</p>
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