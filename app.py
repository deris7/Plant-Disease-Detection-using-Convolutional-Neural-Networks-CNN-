# =[Modules dan Packages]========================
import matplotlib
matplotlib.use('Agg')  # Menetapkan backend non-GUI
from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename
import pandas as pd
import numpy as np
import os
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Activation, Dropout, ReLU
from PIL import Image
from fungsi import make_model
from flask import Flask, render_template, request, jsonify
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
import matplotlib.pyplot as plt
import io
import base64
# =[Variabel Global]=============================

app = Flask(__name__, static_url_path='/static')

app.config['MAX_CONTENT_LENGTH'] = 6* 1024 * 1024
app.config['UPLOAD_EXTENSIONS']  = ['.jpg', '.JPG','.jpeg','.png']
app.config['UPLOAD_PATH']        = './static/images/uploads/'

model = None

n_classes = 6
Class_Penyakit = ['Cabai Anthracnose','Cabai Normal','Cabai leaf curl','Tomat Normal','Tomat Early blight','Tomat Late Blight']

# =[Routing]=====================================

@app.route("/")
def beranda():
    return render_template('index.html')

@app.route("/api/deteksi", methods=['POST'])
def apiDeteksi():
    hasil_prediksi  = '(none)'
    gambar_prediksi = '(none)'
    confidence_score = 0.0

    uploaded_file = request.files['file']
    filename      = secure_filename(uploaded_file.filename)

    if filename != '':
        file_ext        = os.path.splitext(filename)[1]
        gambar_prediksi = os.path.join(app.config['UPLOAD_PATH'], filename)

        # Buat direktori jika belum ada
        upload_folder = app.config['UPLOAD_PATH']
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)

        if file_ext in app.config['UPLOAD_EXTENSIONS']:
            uploaded_file.save(gambar_prediksi)

            try:
                # Preprocessing gambar
                test_image = Image.open(gambar_prediksi)
                if test_image.mode != "RGB":
                    test_image = test_image.convert("RGB")  # Pastikan gambar memiliki 3 channel (RGB)
                test_image_resized = test_image.resize((256, 256))  # Sesuaikan dengan ukuran input model
                image_array = np.array(test_image_resized)

                # Normalisasi dan ubah gambar menjadi format batch
                test_image_x = (image_array / 255.0)  # Normalisasi ke skala 0-1
                test_image_x = np.expand_dims(test_image_x, axis=0)

                # Prediksi Gambar
                y_pred_test_single = model.predict(test_image_x)
                y_pred_test_classes_single = np.argmax(y_pred_test_single, axis=1)
                
                hasil_prediksi = Class_Penyakit[y_pred_test_classes_single[0]]
                confidence_score = np.max(y_pred_test_single)  # Ambil confidence score tertinggi
                confidence_score = round(float(confidence_score), 4)  # Membatasi confidence score ke 4 desimal

            except Exception as e:
                hasil_prediksi = 'Error processing image'
                confidence_score = 0.0

            # finally:
            #     os.remove(gambar_prediksi)  # Hapus gambar setelah selesai (Opsional)

            return jsonify({
                "prediksi": hasil_prediksi,
                "confidence": confidence_score,
                "gambar_prediksi": gambar_prediksi
            })
        else:
            return jsonify({
                "prediksi": hasil_prediksi,
                "confidence": confidence_score,
                "gambar_prediksi": gambar_prediksi
            })
        
@app.route('/process', methods=['POST'])
def process_image():
    uploaded_file = request.files['file']
    if uploaded_file.filename != '':
        # Convert FileStorage to PIL Image
        image = Image.open(uploaded_file.stream).convert('RGB')
        # Resize and preprocess image
        image = image.resize((256, 256))
        image_array = tf.keras.preprocessing.image.img_to_array(image)
        image_array = np.expand_dims(image_array, axis=0) / 255.0

        # Get model predictions and intermediate layer outputs
        conv_layer_outputs = [layer.output for layer in model.layers if 'conv2d' in layer.name]
        activation_model = tf.keras.models.Model(inputs=model.input, outputs=conv_layer_outputs)
        activations = activation_model.predict(image_array)

        # Prepare visualization data
        layer_names = [layer.name for layer in model.layers if 'conv2d' in layer.name]
        num_layers = len(layer_names)

        # Create a single figure for all Conv2D visualizations in one horizontal row
        fig, axes = plt.subplots(1, num_layers, figsize=(15 * num_layers, 15))  # Significantly larger size
        if num_layers == 1:  # Handle case for single Conv2D layer
            axes = [axes]

        for i, (activation, layer_name) in enumerate(zip(activations, layer_names)):
            ax = axes[i]
            mean_activation = np.mean(activation[0], axis=-1)
            ax.imshow(mean_activation, cmap='viridis')
            ax.set_title(layer_name, fontsize=10)  # Larger font size for titles
            ax.axis('off')  # Turn off axes for cleaner look

        # Save the entire figure to a string
        buf = io.BytesIO()
        plt.tight_layout()
        plt.savefig(buf, format='png')
        buf.seek(0)
        encoded_image = base64.b64encode(buf.read()).decode('utf-8')
        buf.close()
        plt.close()

        # Return the grid visualization as JSON
        return jsonify({"visualization": encoded_image})

    return jsonify({"error": "No file uploaded"})
# =[Main]========================================

# Load model di luar 'if __name__ == '__main__''
model = make_model(n_classes=n_classes)
model.load_weights("./model_penyakit_tanaman7.h5")  # Sesuaikan jalur ke file model

if __name__ == '__main__':  
    app.run(host='0.0.0.0', debug=True)  