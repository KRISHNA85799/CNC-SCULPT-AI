// =====================================
// CNC SCULPT AI - MAIN JAVASCRIPT
// =====================================

const input = document.getElementById("imageInput");
const original = document.getElementById("originalCanvas");
const depth = document.getElementById("depthCanvas");

const octx = original.getContext("2d");
const dctx = depth.getContext("2d");

const generateBtn = document.getElementById("generateBtn");
const downloadBtn = document.getElementById("downloadBtn");

let loaded = false;
let aiDepthPixels = null;


// =====================================
// IMAGE UPLOAD AND PREVIEW
// =====================================

input.addEventListener("change", function () {

    const file = input.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (event) {

        const img = new Image();

        img.onload = function () {

            const scale = Math.min(
                1,
                700 / Math.max(img.width, img.height)
            );

            const w = Math.round(img.width * scale);
            const h = Math.round(img.height * scale);

            original.width = depth.width = w;
            original.height = depth.height = h;

            octx.clearRect(0, 0, w, h);
            dctx.clearRect(0, 0, w, h);

            octx.drawImage(img, 0, 0, w, h);

            loaded = true;
            aiDepthPixels = null;

        };

        img.src = event.target.result;

    };

    reader.readAsDataURL(file);

});


// =====================================
// REAL AI DEPTH GENERATION
// =====================================

generateBtn.addEventListener("click", async function () {

    const file = input.files[0];

    if (!file) {
        alert("Please select an image first!");
        return;
    }

    generateBtn.disabled = true;
    generateBtn.textContent = "AI Generating...";

    try {

        const formData = new FormData();

        formData.append("file", file);

        const response = await fetch(
            "/generate-depth",
            {
                method: "POST",
                body: formData
            }
        );

        if (!response.ok) {
            throw new Error(
                "AI Server Error: " + response.status
            );
        }

        const contentType =
            response.headers.get("content-type") || "";

        if (!contentType.includes("image/png")) {

            const errorData = await response.json();

            throw new Error(
                errorData.error || "Depth generation failed"
            );

        }

        const blob = await response.blob();

        const imageURL = URL.createObjectURL(blob);

        const img = new Image();

        img.onload = function () {

            depth.width = img.width;
            depth.height = img.height;

            dctx.clearRect(
                0, 0,
                depth.width,
                depth.height
            );

            dctx.drawImage(img, 0, 0);

            aiDepthPixels = dctx.getImageData(
                0,
                0,
                depth.width,
                depth.height
            );

            URL.revokeObjectURL(imageURL);

            generateBtn.textContent = "Generate AI Depth";
            generateBtn.disabled = false;

            alert(
                "Real AI Depth Map Generated Successfully!"
            );

        };

        img.onerror = function () {

            URL.revokeObjectURL(imageURL);

            generateBtn.textContent = "Generate AI Depth";
            generateBtn.disabled = false;

            alert("Could not load generated depth image!");

        };

        img.src = imageURL;

    } catch (error) {

        alert("Error: " + error.message);

        generateBtn.textContent = "Generate AI Depth";
        generateBtn.disabled = false;

    }

});


// =====================================
// BRIGHTNESS AND CONTRAST
// =====================================

function adjustDepth() {

    if (!aiDepthPixels) return;

    const brightness = Number(
        document.getElementById("brightness").value
    );

    const contrast = Number(
        document.getElementById("contrast").value
    ) / 100;

    const imageData = new ImageData(
        new Uint8ClampedArray(aiDepthPixels.data),
        aiDepthPixels.width,
        aiDepthPixels.height
    );

    const pixels = imageData.data;

    for (let i = 0; i < pixels.length; i += 4) {

        let gray = pixels[i];

        gray = (gray - 128) * contrast + 128 + brightness;

        gray = Math.max(0, Math.min(255, gray));

        pixels[i] = gray;
        pixels[i + 1] = gray;
        pixels[i + 2] = gray;

    }

    dctx.putImageData(imageData, 0, 0);

}

document.getElementById("brightness")
.addEventListener("input", adjustDepth);

document.getElementById("contrast")
.addEventListener("input", adjustDepth);


// =====================================
// DOWNLOAD DEPTH MAP
// =====================================

downloadBtn.addEventListener("click", function () {

    if (!aiDepthPixels) {
        alert("Generate AI Depth Map first!");
        return;
    }

    const link = document.createElement("a");

    link.download = "CNC_AI_Depth_Map.png";

    link.href = depth.toDataURL("image/png");

    link.click();

});


// =====================================
// CNC SCULPT AI - 3D RELIEF GENERATOR
// =====================================

let scene3D;
let camera3D;
let renderer3D;
let controls3D;
let reliefMesh = null;

const preview3D =
    document.getElementById("threePreview");


// =====================================
// INITIALIZE 3D VIEWER
// =====================================

function initialize3D() {

    if (scene3D) return;

    scene3D = new THREE.Scene();

    scene3D.background =
        new THREE.Color(0x151923);

    camera3D = new THREE.PerspectiveCamera(
        45,
        1,
        0.1,
        2000
    );

    camera3D.position.set(250, -250, 250);

    renderer3D = new THREE.WebGLRenderer({
        antialias: true
    });

    renderer3D.setPixelRatio(
        window.devicePixelRatio
    );

    preview3D.appendChild(
        renderer3D.domElement
    );

    controls3D = new THREE.OrbitControls(
        camera3D,
        renderer3D.domElement
    );

    controls3D.enableDamping = true;

    const ambient = new THREE.AmbientLight(
        0xffffff,
        0.8
    );

    scene3D.add(ambient);

    const light = new THREE.DirectionalLight(
        0xffffff,
        1.2
    );

    light.position.set(100, -100, 200);

    scene3D.add(light);

    const grid = new THREE.GridHelper(500, 20);

    grid.rotation.x = Math.PI / 2;

    grid.position.z = -1;

    scene3D.add(grid);

    resize3D();

    animate3D();

}


// =====================================
// RESIZE VIEWER
// =====================================

function resize3D() {

    if (!renderer3D) return;

    const width = preview3D.clientWidth || 700;

    const height = 450;

    renderer3D.setSize(width, height);

    camera3D.aspect = width / height;

    camera3D.updateProjectionMatrix();

}


// =====================================
// ANIMATION
// =====================================

function animate3D() {

    requestAnimationFrame(animate3D);

    if (!renderer3D) return;

    controls3D.update();

    renderer3D.render(scene3D, camera3D);

}


// =====================================
// CREATE 3D RELIEF
// =====================================

document.getElementById("create3D")
.addEventListener("click", function () {

    if (!aiDepthPixels) {
        alert("Please generate AI Depth Map first!");
        return;
    }

    initialize3D();

    const widthMM = Number(
        document.getElementById("modelWidth").value
    );

    const heightMM = Number(
        document.getElementById("modelHeight").value
    );

    const depthMM = Number(
        document.getElementById("carvingDepth").value
    );

    if (
        !Number.isFinite(widthMM) ||
        !Number.isFinite(heightMM) ||
        !Number.isFinite(depthMM) ||
        widthMM <= 0 ||
        heightMM <= 0 ||
        depthMM <= 0
    ) {

        alert("Enter valid model dimensions!");

        return;

    }

    const sourceCanvas =
        document.createElement("canvas");

    const sourceCtx =
        sourceCanvas.getContext("2d");

    sourceCanvas.width = aiDepthPixels.width;

    sourceCanvas.height = aiDepthPixels.height;

    sourceCtx.putImageData(aiDepthPixels, 0, 0);

    const maxSize = 400;

    const scale = Math.min(
        1,
        maxSize / Math.max(
            sourceCanvas.width,
            sourceCanvas.height
        )
    );

    const cols = Math.max(
        2,
        Math.round(sourceCanvas.width * scale)
    );

    const rows = Math.max(
        2,
        Math.round(sourceCanvas.height * scale)
    );

    const smallCanvas =
        document.createElement("canvas");

    smallCanvas.width = cols;
    smallCanvas.height = rows;

    const smallCtx =
        smallCanvas.getContext("2d");

    smallCtx.drawImage(
        sourceCanvas,
        0,
        0,
        cols,
        rows
    );

    const pixels = smallCtx.getImageData(
        0,
        0,
        cols,
        rows
    ).data;

    const vertices = [];
    const indices = [];

    const count = cols * rows;

    const dx = widthMM / (cols - 1);
    const dy = heightMM / (rows - 1);

    // TOP SURFACE

    for (let y = 0; y < rows; y++) {

        for (let x = 0; x < cols; x++) {

            const index = (y * cols + x) * 4;

            const gray = pixels[index];

            const z = (gray / 255) * depthMM;

            vertices.push(
                x * dx - widthMM / 2,
                heightMM / 2 - y * dy,
                z
            );

        }

    }

    // TOP TRIANGLES

    for (let y = 0; y < rows - 1; y++) {

        for (let x = 0; x < cols - 1; x++) {

            const a = y * cols + x;

            const b = a + 1;

            const c = a + cols;

            const d = c + 1;

            indices.push(a, c, b);

            indices.push(b, c, d);

        }

    }

    // BOTTOM SURFACE

    const bottomStart = vertices.length / 3;

    for (let i = 0; i < count; i++) {

        vertices.push(
            vertices[i * 3],
            vertices[i * 3 + 1],
            0
        );

    }

    for (let y = 0; y < rows - 1; y++) {

        for (let x = 0; x < cols - 1; x++) {

            const a = bottomStart + y * cols + x;

            const b = a + 1;

            const c = a + cols;

            const d = c + 1;

            indices.push(a, b, c);

            indices.push(b, d, c);

        }

    }

    // SIDE WALLS

    function addSide(a, b) {

        const ba = bottomStart + a;

        const bb = bottomStart + b;

        indices.push(a, ba, b);

        indices.push(b, ba, bb);

    }

    // TOP AND BOTTOM EDGES

    for (let x = 0; x < cols - 1; x++) {

        addSide(x, x + 1);

        const a = (rows - 1) * cols + x;

        addSide(a + 1, a);

    }

    // LEFT AND RIGHT EDGES

    for (let y = 0; y < rows - 1; y++) {

        const left = y * cols;

        addSide(left + cols, left);

        const right =
            y * cols + cols - 1;

        addSide(right, right + cols);

    }

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(vertices, 3)
    );

    geometry.setIndex(indices);

    geometry.computeVertexNormals();

    if (reliefMesh) {

        scene3D.remove(reliefMesh);

        reliefMesh.geometry.dispose();

        reliefMesh.material.dispose();

    }

    const material =
        new THREE.MeshStandardMaterial({

            color: 0xc69b62,

            roughness: 0.75,

            metalness: 0.05,

            side: THREE.DoubleSide

        });

    reliefMesh = new THREE.Mesh(
        geometry,
        material
    );

    scene3D.add(reliefMesh);

    camera3D.position.set(
        widthMM * 0.9,
        -heightMM * 1.1,
        Math.max(widthMM, heightMM) * 0.9
    );

    controls3D.target.set(
        0,
        0,
        depthMM / 2
    );

    controls3D.update();

    alert("3D CNC Relief Created Successfully!");

});
// =====================================
// DEPTH SLIDER
// =====================================

document.getElementById("carvingDepth")
.addEventListener("input", function () {

    document.getElementById("depthValue").textContent =
        this.value + " mm";

});


// =====================================
// STL EXPORT
// =====================================

document.getElementById("exportSTL")
.addEventListener("click", function () {

    if (!reliefMesh) {
        alert("Please create 3D Relief first!");
        return;
    }

    const exporter = new THREE.STLExporter();

    const stlData = exporter.parse(
        reliefMesh,
        { binary: true }
    );

    const blob = new Blob(
        [stlData],
        { type: "application/octet-stream" }
    );

    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);

    link.download = "CNC_Sculpt_Relief.stl";

    link.click();

    setTimeout(() => {
        URL.revokeObjectURL(link.href);
    }, 1000);

    alert("STL File Downloaded!");

});


// =====================================
// EXISTING DEPTH MAP UPLOAD
// =====================================

const depthInput = document.getElementById("depthInput");

if (depthInput) {

    depthInput.addEventListener("change", function (event) {

        const file = event.target.files[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {

            alert("Please select PNG or JPG Depth Map!");

            depthInput.value = "";

            return;

        }

        const imageURL = URL.createObjectURL(file);

        const img = new Image();

        img.onload = function () {

            depth.width = img.naturalWidth;
            depth.height = img.naturalHeight;

            dctx.clearRect(
                0,
                0,
                depth.width,
                depth.height
            );

            dctx.drawImage(
                img,
                0,
                0,
                depth.width,
                depth.height
            );

            aiDepthPixels = dctx.getImageData(
                0,
                0,
                depth.width,
                depth.height
            );

            loaded = true;

            URL.revokeObjectURL(imageURL);

            alert(
                "Existing Depth Map Loaded Successfully! Now click Create 3D Relief."
            );

        };

        img.onerror = function () {

            URL.revokeObjectURL(imageURL);

            alert("Unable to load Depth Map!");

        };

        img.src = imageURL;

    });

}