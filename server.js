const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const archiver = require('archiver');
const fs = require('fs');
const potrace = require('potrace');

const app = express();
const port = 3000;

// Настройка express для обработки загрузок файлов
app.use(fileUpload());
app.use(express.static(path.join(__dirname)));

// Маршрут для загрузки и векторизации файлов
app.post('/upload', async (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('Файлы не были загружены.');
    }

    const files = Array.isArray(req.files.files) ? req.files.files : [req.files.files];
    const outputDir = path.join(__dirname, 'output');
    
    // Создаем директорию для векторизованных изображений, если её нет
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    const vectorizedFiles = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = path.join(outputDir, file.name);
        
        // Сохраняем исходное изображение
        await file.mv(filePath);

        // Путь для векторизованного изображения с порядковыми номерами
        const vectorizedPath = path.join(outputDir, `${i + 1}.svg`);

        // Векторизация изображения
        await new Promise((resolve, reject) => {
            potrace.trace(filePath, (err, svg) => {
                if (err) {
                    reject(err);
                } else {
                    fs.writeFileSync(vectorizedPath, svg);
                    vectorizedFiles.push(vectorizedPath);
                    resolve();
                }
            });
        });
    }

    // Создаем архив с векторизованными файлами
    const archiveName = 'vectorized_files.zip';
    const archivePath = path.join(__dirname, archiveName);

    const output = fs.createWriteStream(archivePath);
    const archive = archiver('zip', {
        zlib: { level: 9 }
    });

    output.on('close', function() {
        res.download(archivePath);
    });

    archive.on('error', function(err) {
        throw err;
    });

    // Добавляем файлы в архив
    archive.pipe(output);
    vectorizedFiles.forEach(file => {
        archive.file(file, { name: path.basename(file) });
    });

    await archive.finalize();
});

// Запуск сервера
app.listen(port, async () => {
    console.log(`Сервер запущен на http://localhost:${port}`);

    // Динамический импорт модуля open
    const open = (await import('open')).default;

    // Открываем браузер с нужным URL
    open(`http://localhost:${port}`);
});


