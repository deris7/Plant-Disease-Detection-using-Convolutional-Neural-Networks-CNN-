$(document).ready(function () {
  // -[Animasi Scroll]---------------------------
  $(".navbar a, footer a[href='#halamanku']").on("click", function (event) {
    if (this.hash !== "") {
      event.preventDefault();
      var hash = this.hash;
      $("html, body").animate(
        {
          scrollTop: $(hash).offset().top,
        },
        900,
        function () {
          window.location.hash = hash;
        }
      );
    }
  });

  $(window).scroll(function () {
    $(".slideanim").each(function () {
      var pos = $(this).offset().top;
      var winTop = $(window).scrollTop();
      if (pos < winTop + 600) {
        $(this).addClass("slide");
      }
    });
  });

  // -[Prediksi Model]---------------------------
  // Fungsi untuk memanggil API ketika tombol prediksi ditekan
  $("#prediksi_submit").click(function (e) {
    e.preventDefault();

    // Get File Gambar yg telah diupload pengguna
    var file_data = $("#input_gambar").prop("files")[0];
    var pics_data = new FormData();
    pics_data.append("file", file_data);

    // Panggil API dengan timeout 1 detik (1000 ms)
    setTimeout(function () {
      try {
        $.ajax({
          url: "/api/deteksi",
          type: "POST",
          data: pics_data,
          processData: false,
          contentType: false,
          success: function (res) {
            // Ambil hasil prediksi dan path gambar yang diprediksi dari API
            res_data_prediksi = res["prediksi"];
            res_gambar_prediksi = res["gambar_prediksi"];
            res_confidence = res["confidence"];

            // Tampilkan hasil prediksi ke halaman web
            generate_prediksi(
              res_data_prediksi,
              res_gambar_prediksi,
              res_confidence
            );

            // Panggil route /process untuk mendapatkan visualisasi activations
            $.ajax({
              url: "/process",
              type: "POST",
              data: pics_data,
              processData: false,
              contentType: false,
              success: function (visualizations) {
                display_visualizations(visualizations);
              },
              error: function (err) {
                console.log("Error fetching activations: ", err);
              },
            });
          },
        });
      } catch (e) {
        // Jika gagal memanggil API, tampilkan error di console
        console.log("Gagal !");
        console.log(e);
      }
    }, 1000);
  });

  // Fungsi untuk menampilkan hasil prediksi model
  function generate_prediksi(data_prediksi, image_prediksi, confidence) {
    var str = "";

    if (image_prediksi == "(none)") {
      str += "<h3>Hasil Prediksi </h3>";
      str += "<br>";
      str += "<h4>Silahkan masukkan file gambar (.jpg)</h4>";
    } else {
      str += "<h3>Hasil Prediksi </h3>";
      str += "<br>";
      str += "<img src='" + image_prediksi + "' width='200'></img>";

      // Jika confidence kurang dari 75%, tampilkan pesan "Maaf Gambar tidak dapat dikenali"
      if (confidence < 0.7) {
        str += "<h4>Maaf Gambar tidak dapat dikenali</h4>";
      } else {
        // Jika confidence cukup tinggi, tampilkan hasil prediksi dan confidence
        str += "<h3>" + data_prediksi + "</h3>";
        str += "<h4>Confidence: " + (confidence * 100).toFixed(2) + "%</h4>";
      }
    }
    $("#hasil_prediksi").html(str);

    // Aktifkan tombol Detail Penyakit jika ada hasil prediksi
    if (data_prediksi !== "Hasil Prediksi") {
      $("#detail_penyakit").prop("disabled", false);

      // Simpan data prediksi untuk digunakan pada pop-up
      $("#detail_penyakit").data("prediksi", data_prediksi);
    } else {
      $("#detail_penyakit").prop("disabled", true);
    }
  }

  // Tambahkan event listener untuk tombol Detail Penyakit
  $("#detail_penyakit").click(function () {
    var penyakit = $(this).data("prediksi");
    showPenyakitDetail(penyakit);
  });

  // Fungsi untuk menampilkan detail penyakit
  function showPenyakitDetail(penyakit) {
    var modal = document.getElementById("myModal");
    var span = document.getElementsByClassName("close")[0];

    // Set judul dan deskripsi penyakit
    var penyakitTitle = document.getElementById("penyakit-title");
    var penyakitDescription = document.getElementById("penyakit-description");
    var penyakitImage = document.getElementById("penyakit-image");

    // Ambil gambar hasil prediksi dari variabel global
    penyakitImage.src = res_gambar_prediksi;

    switch (penyakit) {
      case "Cabai Anthracnose":
        penyakitTitle.textContent = "Cabai Anthracnose";
        penyakitDescription.textContent =
          "Penyakit Cabai Anthracnose disebabkan oleh jamur Colletotrichum capsici. Gejala awalnya muncul sebagai bercak kecil berwarna cokelat pada daun, batang, dan buah. Seiring perkembangan penyakit, bercak tersebut akan membesar dan berubah menjadi bercak hitam yang mengeras, yang dapat menyebabkan buah jatuh sebelum matang. Untuk mengendalikan penyakit ini, penting untuk menggunakan bibit yang bebas dari penyakit, melakukan rotasi tanaman, serta menjaga kelembapan tanah agar tidak berlebihan. Penggunaan fungisida juga dapat diterapkan sebagai langkah pencegahan.";
        break;
      case "Cabai Normal":
        penyakitTitle.textContent = "Cabai Sehat";
        penyakitDescription.textContent =
          "Cabai Anda tampak sehat dan tidak menunjukkan gejala penyakit. Daun hijau cerah dan batang yang kuat menunjukkan bahwa tanaman dalam kondisi baik. Untuk mempertahankan kondisi ini, pemeliharaan yang baik sangat penting, termasuk penyiraman yang tepat, pemupukan yang seimbang, dan pengendalian hama secara rutin.";
        break;
      case "Cabai Leaf Curl":
        penyakitTitle.textContent = "Cabai Leaf Curl";
        penyakitDescription.textContent =
          "Penyakit Cabai Leaf Curl disebabkan oleh virus seperti Cucumber mosaic virus (CMV) dan Tomato yellow leaf curl virus (TYLCV). Gejala yang muncul meliputi daun yang menjadi kecil, menguning, dan menggulung ke atas, yang mengindikasikan bahwa pertumbuhan tanaman terhambat. Untuk mengendalikan penyakit ini, penting untuk menggunakan bibit yang bebas virus, mengendalikan serangga vektor seperti kutu daun, dan menghapus tanaman yang terinfeksi untuk mencegah penyebaran lebih lanjut.";
        break;
      case "Tomat Normal":
        penyakitTitle.textContent = "Tomat Sehat";
        penyakitDescription.textContent =
          "Tomat Anda tampak sehat dan tidak menunjukkan gejala penyakit. Daun hijau cerah dan batang yang kuat menunjukkan bahwa tanaman dalam kondisi baik. Untuk menjaga kesehatan tanaman tomat, pemeliharaan yang baik, termasuk penyiraman yang tepat dan pengendalian hama, sangat diperlukan.";
        break;
      case "Tomat Early Blight":
        penyakitTitle.textContent = "Tomat Early Blight";
        penyakitDescription.textContent =
          "Penyakit Tomat Early Blight disebabkan oleh jamur Alternaria solani. Gejala awalnya ditandai dengan bercak kecil berwarna cokelat pada daun, seringkali dengan tepi kuning. Bercak ini dapat berkembang menjadi bercak hitam yang mengeras dan dapat muncul pada batang serta buah, menyebabkan pertumbuhan yang tidak sehat. Pengendalian penyakit ini dapat dilakukan dengan menggunakan bibit yang bebas penyakit, melakukan rotasi tanaman, serta menjaga kelembapan tanah agar tidak berlebihan.";
        break;
      case "Tomat Late Blight":
        penyakitTitle.textContent = "Tomat Late Blight";
        penyakitDescription.textContent =
          "Penyakit Tomat Late Blight disebabkan oleh jamur Phytophthora infestans. Gejala awalnya berupa bercak hijau kekuningan pada daun, yang kemudian berubah menjadi bercak hitam. Daun yang terinfeksi dapat layu dan jatuh, sementara buah dapat mengalami pembusukan. Untuk mengendalikan penyakit ini, penting untuk menggunakan bibit yang bebas penyakit, menjaga sirkulasi udara yang baik di antara tanaman, dan menghindari penyiraman yang berlebihan.";
        break;
      default:
        penyakitTitle.textContent = "Penyakit Tidak Dikenali";
        penyakitDescription.textContent =
          "Penyakit yang Anda alami tidak dikenali oleh sistem.";
        break;
    }

    // Tampilkan modal
    modal.style.display = "block";

    // Ketika pengguna mengklik di luar modal, tutup modal
    window.onclick = function (event) {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    };

    // Ketika pengguna mengklik tombol close, tutup modal
    span.onclick = function () {
      modal.style.display = "none";
    };
  }
  // Fungsi untuk menampilkan visualisasi activations
  function display_visualizations(visualizations) {
    var visualizationsHTML = "<h3>Visualisasi Layers Conv2D Model</h3>";

    for (var layerName in visualizations) {
      var encodedImage = visualizations[layerName];
      visualizationsHTML += "<h4>" + layerName + "</h4>";
      visualizationsHTML +=
        "<img src='data:image/png;base64," +
        encodedImage +
        "' width='900' height='600' /> <br>";
    }

    $("#visualizations").html(visualizationsHTML);
  }
});
