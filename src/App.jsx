import React, { useState, useEffect } from 'react';
import { 
  Home, Users, Bell, FileText, Phone, Menu, X, 
  Wallet, ChevronRight, FileCheck, AlertCircle, Calendar,
  MapPin, Home as HomeIcon, Search, Lock, LogOut, Trash2, Plus, CheckCircle
} from 'lucide-react';

// === IMPORT FIREBASE ===
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';

// ==========================================
// PASTE FIREBASE CONFIG ANDA DI SINI
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyBA2MySUXB7cqlbFeGMpQrjRU_MiMzQQ60",
  authDomain: "santunan-jaya.firebaseapp.com",
  projectId: "santunan-jaya",
  storageBucket: "santunan-jaya.firebasestorage.app",
  messagingSenderId: "683091231734",
  appId: "1:683091231734:web:a4259a84e5d4e90bb43dd7"
};

// Inisialisasi Firebase (Dengan Fallback jika belum diisi)
let db = null;
try {
  if (firebaseConfig.apiKey !== "API_KEY_ANDA") {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  }
} catch (error) {
  console.error("Firebase tidak tersambung:", error);
}

export default function App() {
  const [activeTab, setActiveTab] = useState('beranda');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notification, setNotification] = useState('');
  
  // State untuk Data (Nantinya diisi dari Firebase)
  const [dataWarga, setDataWarga] = useState([]);
  const [laporanKas, setLaporanKas] = useState([]);
  const [laporanWarga, setLaporanWarga] = useState([]);

  // ==========================================
  // MENGAMBIL DATA DARI FIREBASE SECARA REALTIME
  // ==========================================
  useEffect(() => {
    if (!db) {
      // Data dummy jika Firebase belum di-setup
      setDataWarga([{ id: '1', nama: 'Contoh Warga', jalan: 'Jl. Santunan 1', noRumah: '1A', status: 'Tetap' }]);
      return;
    }

    // Ambil Data Warga
    const unsubWarga = onSnapshot(collection(db, "warga"), (snapshot) => {
      setDataWarga(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Ambil Kas RT
    const unsubKas = onSnapshot(collection(db, "kas"), (snapshot) => {
      setLaporanKas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Ambil Laporan
    const unsubLapor = onSnapshot(collection(db, "laporan"), (snapshot) => {
      setLaporanWarga(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubWarga();
      unsubKas();
      unsubLapor();
    };
  }, []);

  const totalMasuk = laporanKas.reduce((acc, curr) => acc + Number(curr.masuk || 0), 0);
  const totalKeluar = laporanKas.reduce((acc, curr) => acc + Number(curr.keluar || 0), 0);
  const saldoAkhir = totalMasuk - totalKeluar;
  const rekapJalan = dataWarga.reduce((acc, curr) => {
    acc[curr.jalan] = (acc[curr.jalan] || 0) + 1;
    return acc;
  }, {});

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginForm.password === '123') { // Simple login (Bisa diganti di Firebase Auth nanti)
      setIsAdminMode(true);
      setShowLogin(false);
      setActiveTab('admin_dashboard');
      showNotification('Login Berhasil!');
    } else {
      alert('Password salah!');
    }
  };

  // Komponen Notifikasi
  const NotificationBar = () => {
    if (!notification) return null;
    return (
      <div className="fixed top-20 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
        <CheckCircle size={20} /> <span className="font-medium text-sm">{notification}</span>
      </div>
    );
  };

  // ==========================================
  // KOMPONEN DASHBOARD ADMIN (Simpan ke Firebase)
  // ==========================================
  const AdminDashboard = () => {
    const [adminMenu, setAdminMenu] = useState('dashboard');
    const [newWarga, setNewWarga] = useState({ nama: '', jalan: 'Jl. Santunan 1', noRumah: '', status: 'Tetap' });

    const tambahWarga = async (e) => {
      e.preventDefault();
      if (!db) return alert("Firebase belum dikonfigurasi!");
      await addDoc(collection(db, "warga"), newWarga);
      setNewWarga({ nama: '', jalan: 'Jl. Santunan 1', noRumah: '', status: 'Tetap' });
      showNotification('Warga berhasil ditambahkan ke Database!');
    };

    const hapusWarga = async (id) => {
      if (!db) return;
      await deleteDoc(doc(db, "warga", id));
      showNotification('Data warga dihapus.');
    };

    return (
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 bg-white rounded-xl shadow-sm border p-4">
          <h3 className="font-bold mb-4">Menu Admin</h3>
          <div className="flex flex-col gap-2">
            <button onClick={() => setAdminMenu('dashboard')} className="text-left py-2 px-3 rounded hover:bg-gray-100">Dashboard</button>
            <button onClick={() => setAdminMenu('kelola_warga')} className="text-left py-2 px-3 rounded hover:bg-gray-100">Kelola Warga</button>
            <button onClick={() => setIsAdminMode(false)} className="text-left py-2 px-3 text-red-600 hover:bg-red-50 rounded mt-4">Logout</button>
          </div>
        </div>

        <div className="flex-1">
          {adminMenu === 'kelola_warga' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Kelola Warga</h2>
              <form onSubmit={tambahWarga} className="bg-white p-4 rounded-xl border flex gap-2">
                <input required value={newWarga.nama} onChange={e=>setNewWarga({...newWarga, nama: e.target.value})} placeholder="Nama..." className="border p-2 rounded flex-1" />
                <select value={newWarga.jalan} onChange={e=>setNewWarga({...newWarga, jalan: e.target.value})} className="border p-2 rounded">
                  <option>Jl. Santunan 1</option><option>Jl. Santunan 2</option><option>Jl. Santunan 3</option><option>Jl. Pengairan</option>
                </select>
                <input required value={newWarga.noRumah} onChange={e=>setNewWarga({...newWarga, noRumah: e.target.value})} placeholder="No Rumah" className="border p-2 rounded w-24" />
                <button type="submit" className="bg-emerald-600 text-white px-4 rounded">Tambah</button>
              </form>

              <div className="bg-white rounded-xl border overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b"><tr><th className="p-3">Nama</th><th className="p-3">Jalan</th><th className="p-3">Aksi</th></tr></thead>
                  <tbody>
                    {dataWarga.map(w => (
                      <tr key={w.id} className="border-b">
                        <td className="p-3">{w.nama}</td>
                        <td className="p-3">{w.jalan} No.{w.noRumah}</td>
                        <td className="p-3"><button onClick={() => hapusWarga(w.id)} className="text-red-500"><Trash2 size={16}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {adminMenu === 'dashboard' && (
             <div>
                <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
                <p>Status Database: {db ? <span className="text-emerald-600 font-bold">Terhubung ke Firebase Aktif</span> : <span className="text-red-600">Menunggu Konfigurasi API Key Firebase Anda</span>}</p>
             </div>
          )}
        </div>
      </div>
    );
  };

  // ==========================================
  // VIEW UTAMA WESBITE
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col">
      <NotificationBar />
      
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleLogin} className="bg-white p-6 rounded-xl w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">Login Admin</h2>
            <p className="text-xs text-gray-500 mb-4">Password demo: 123</p>
            <input type="password" placeholder="Password" value={loginForm.password} onChange={e=>setLoginForm({...loginForm, password: e.target.value})} className="w-full border p-2 rounded mb-4" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowLogin(false)} className="flex-1 bg-gray-100 p-2 rounded">Batal</button>
              <button type="submit" className="flex-1 bg-emerald-600 text-white p-2 rounded">Masuk</button>
            </div>
          </form>
        </div>
      )}

      {/* Navbar Public */}
      <nav className="bg-emerald-700 text-white p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <span className="font-bold flex items-center gap-2"><Users /> RT 01 / RW 02</span>
          {!isAdminMode && (
            <div className="flex gap-4">
              <button onClick={() => setActiveTab('beranda')}>Beranda</button>
              <button onClick={() => setActiveTab('data_warga')}>Data Warga</button>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 w-full flex-1 mt-4">
        {isAdminMode ? <AdminDashboard /> : (
          <div>
            {activeTab === 'beranda' && (
               <div className="text-center py-12">
                 <h1 className="text-4xl font-bold text-gray-800 mb-4">Selamat Datang di Portal Warga</h1>
                 <p className="text-gray-600">Informasi dan data warga tersimpan aman di Database (Firebase).</p>
                 <button onClick={() => setActiveTab('data_warga')} className="mt-6 bg-emerald-600 text-white px-6 py-2 rounded-full">Lihat Data Warga</button>
               </div>
            )}
            
            {activeTab === 'data_warga' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Daftar Warga</h2>
                {!db && <div className="bg-orange-100 text-orange-800 p-4 rounded mb-4">Database belum di-setup. Ini adalah data percobaan.</div>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dataWarga.map(w => (
                    <div key={w.id} className="bg-white p-4 rounded-xl shadow-sm border">
                      <h3 className="font-bold text-lg">{w.nama}</h3>
                      <p className="text-gray-600 text-sm flex items-center gap-1 mt-1"><HomeIcon size={14}/> {w.jalan} No. {w.noRumah}</p>
                      <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded mt-2 inline-block">Warga {w.status}</span>
                    </div>
                  ))}
                  {dataWarga.length === 0 && <p className="text-gray-500">Belum ada data warga di database.</p>}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-gray-900 text-gray-400 py-6 text-center mt-auto">
        <p>© 2026 Portal Warga RT 01</p>
        {!isAdminMode && <button onClick={() => setShowLogin(true)} className="text-xs mt-2 hover:text-white flex items-center justify-center w-full gap-1"><Lock size={12}/> Login Admin</button>}
      </footer>
    </div>
  );
}