/* data.js - contoh minimal */
window.newsData = [
  {
    id: "news-001",
    title: "Ancelotti: Kami Tidak Pernah Menyerah",
    date: "5 November 2025",
    image: "https://i.postimg.cc/y60xJ6GP/9ef7d9abcf3b5beeeceefe43b98abf32.jpg",
    summary: "Sang pelatih memuji kerja keras tim setelah laga penuh tekanan.",
    content: "<p><strong>Carlos Ancelotti:</strong></p><p>“Kami tidak pernah menyerah...”</p>"
  }
  ];
  
  window.newsData = [
  {
    id: "news-001",
    title: "Kylian Mbappe: Seneng lu dapet sepatu emash",
    date: "6 November 2025",
    image: "https://i.postimg.cc/y60xJ6GP/9ef7d9abcf3b5beeeceefe43b98abf32.jpg",
    summary: "Sang pelatih memuji kerja keras tim setelah laga penuh tekanan.",
    content: "<p><strong>Carlos Ancelotti:</strong></p><p>“Bermain untuk Real Madrid adalah mimpi saya sejak kecil. Sekarang saya di sini, dan saya berharap bisa bertahan selama bertahun-tahun. Penghargaan ini sangat berarti bagi saya — terima kasih untuk rekan setim, klub, dan fans yang selalu mendukung. Kami adalah grup yang luar biasa, dan saya yakin kami bisa memenangkan banyak hal bersama.”</p>"
  }
];

window.matches = [
  {
    id: "match-001",
    title: "Real Madrid vs Barcelona",
    dateHuman: "Minggu, 10 November 2025",
    date: "2025-11-10",
    time: "03:00 WIB",
    stadium: "Santiago Bernabéu Stadium",
    image: "https://i.postimg.cc/y8MPdVxX/9ef7d9abcf3b5beeeceefe43b98abf32.jpg",
    url: "schedule.html#match-001",
    content: "<p>Informasi pertandingan: kickoff, lokasi, tiket, link, daianwjajan. ajsbauajaka. auaysgsysuaua. auahsusua. aushshsuuz. majid adalah orang kaya. dan akan beas. oke oke oke nect mantap.</p>"
  },
  // tambah lagi sesuai kebutuhan...
];

/* optional alias supaya script yang pake nama lain tetep work */
if (typeof window.scheduleData === "undefined") window.scheduleData = window.matches;
if (typeof window.news === "undefined") window.news = window.newsData;