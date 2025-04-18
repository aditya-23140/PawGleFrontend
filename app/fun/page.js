'use client';
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
// Fix fabric import - import the module directly
import * as fabric from "fabric";
import CirclesBackground from "@/components/background";
import Footer from "@/components/footer";
import { removeBackground } from "@imgly/background-removal";

const BACKEND_API_PORT = process.env.NEXT_PUBLIC_BACKEND_API_PORT;

export default function PetMediaEditor() {
    const [windowWidth, setWindowWidth] = useState(0);
    const [selectedImage, setSelectedImage] = useState(null);
    const [recentEdits, setRecentEdits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processingBg, setProcessingBg] = useState(false);
    const [selectedTool, setSelectedTool] = useState("shapes");
    const [selectedShape, setSelectedShape] = useState("rect");
    const [selectedFilter, setSelectedFilter] = useState(null);
    const [aspectRatio, setAspectRatio] = useState("original");

    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const fabricCanvasRef = useRef(null);

    useEffect(() => {
        setWindowWidth(window.innerHeight);
        const handleResize = () => setWindowWidth(window.innerHeight);
        window.addEventListener("resize", handleResize);

        // Initialize canvas
        if (canvasRef.current && !fabricCanvasRef.current) {
            fabricCanvasRef.current = new fabric.Canvas(canvasRef.current, {
                width: 600,
                height: 600,
                backgroundColor: "#f0f0f0",
            });
        }

        fetchRecentEdits();

        return () => {
            window.removeEventListener("resize", handleResize);
            if (fabricCanvasRef.current) {
                fabricCanvasRef.current.dispose();
            }
        };
    }, []);

    const fetchRecentEdits = async () => {
        try {
            const token = localStorage.getItem('accessToken'); // Get token from storage
            const response = await fetch(`${BACKEND_API_PORT}/api/auth/edited-pet-images/`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const contentType = response.headers.get("content-type");
            if (!response.ok) {
                // Optionally log the error body for debugging
                const errorText = await response.text();
                console.error("Error response:", errorText);
                return;
            }
            if (contentType && contentType.includes("application/json")) {
                const data = await response.json();
                setRecentEdits(data);
            } else {
                const text = await response.text();
                console.error("Expected JSON but got:", text);
            }
        } catch (error) {
            console.error("Error fetching recent edits:", error);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            // Use fabric.Image.fromURL for better handling
            fabric.Image.fromURL(event.target.result, (fabricImage) => {
                // Clear the canvas before adding a new image
                fabricCanvasRef.current.clear();

                // Scale the image if it's too large
                if (fabricImage.width > 600 || fabricImage.height > 600) {
                    const scale = Math.min(600 / fabricImage.width, 600 / fabricImage.height);
                    fabricImage.scale(scale);
                }

                // Center and add the image
                fabricCanvasRef.current.add(fabricImage);
                fabricCanvasRef.current.centerObject(fabricImage);
                fabricCanvasRef.current.setActiveObject(fabricImage);
                fabricCanvasRef.current.renderAll();

                // Save the selected file for later use
                setSelectedImage(file);
            });
        };
        reader.readAsDataURL(file);
    };

    const addShape = () => {
        let shape;
        switch (selectedShape) {
            case "rect":
                shape = new fabric.Rect({
                    left: 100,
                    top: 100,
                    width: 100,
                    height: 100,
                    fill: "rgba(255, 0, 0, 0.5)",
                });
                break;
            case "circle":
                shape = new fabric.Circle({
                    left: 100,
                    top: 100,
                    radius: 50,
                    fill: "rgba(0, 255, 0, 0.5)",
                });
                break;
            case "triangle":
                shape = new fabric.Triangle({
                    left: 100,
                    top: 100,
                    width: 100,
                    height: 100,
                    fill: "rgba(0, 0, 255, 0.5)",
                });
                break;
            case "star":
                const points = [];
                for (let i = 0; i < 10; i++) {
                    const radius = i % 2 === 0 ? 50 : 25;
                    const angle = (Math.PI / 5) * i;
                    points.push({
                        x: radius * Math.sin(angle),
                        y: radius * Math.cos(angle),
                    });
                }
                shape = new fabric.Polygon(points, {
                    left: 100,
                    top: 100,
                    fill: "rgba(255, 255, 0, 0.5)",
                });
                break;
            default:
                shape = new fabric.Rect({
                    left: 100,
                    top: 100,
                    width: 100,
                    height: 100,
                    fill: "rgba(255, 0, 0, 0.5)",
                });
        }
        fabricCanvasRef.current.add(shape);
        fabricCanvasRef.current.setActiveObject(shape);
        fabricCanvasRef.current.renderAll();
    };

    const addOverlay = (overlayType) => {
        let overlay;
        switch (overlayType) {
            case "paw":
                const pawPath = "M25,25 C33,20 38,25 40,40 C42,55 38,60 30,65 C22,60 18,55 20,40 C22,25 27,20 35,25 M45,5 C53,0 58,5 60,20 C62,35 58,40 50,45 C42,40 38,35 40,20 C42,5 47,0 55,5 M65,5 C73,0 78,5 80,20 C82,35 78,40 70,45 C62,40 58,35 60,20 C62,5 67,0 75,5 M85,25 C93,20 98,25 100,40 C102,55 98,60 90,65 C82,60 78,55 80,40 C82,25 87,20 95,25 M60,75 C70,60 80,60 90,75 C100,90 90,105 60,105 C30,105 20,90 30,75 C40,60 50,60 60,75";
                overlay = new fabric.Path(pawPath, {
                    left: 100,
                    top: 100,
                    scaleX: 0.5,
                    scaleY: 0.5,
                    fill: "rgba(150, 75, 0, 0.7)",
                });
                break;
            case "hat":
                const hatPath = "M10,50 L90,50 L80,10 C65,0 35,0 20,10 Z";
                overlay = new fabric.Path(hatPath, {
                    left: 100,
                    top: 100,
                    fill: "rgba(255, 0, 0, 0.7)",
                });
                break;
            case "collar":
                overlay = new fabric.Rect({
                    left: 100,
                    top: 100,
                    width: 200,
                    height: 40,
                    rx: 20,
                    ry: 20,
                    fill: "rgba(0, 0, 255, 0.7)",
                });
                // Add a tag
                const tag = new fabric.Circle({
                    left: 190,
                    top: 120,
                    radius: 15,
                    fill: "rgba(255, 215, 0, 0.9)",
                });
                fabricCanvasRef.current.add(tag);
                break;
            default:
                overlay = new fabric.Rect({
                    left: 100,
                    top: 100,
                    width: 100,
                    height: 100,
                    fill: "rgba(255, 0, 0, 0.5)",
                });
        }
        fabricCanvasRef.current.add(overlay);
        fabricCanvasRef.current.setActiveObject(overlay);
        fabricCanvasRef.current.renderAll();
    };

    const applyFilter = (filterType) => {
        setSelectedFilter(filterType);
        const objects = fabricCanvasRef.current.getObjects();
        const imageObj = objects.find(obj => obj.type === "image");
        if (!imageObj) return;

        // Reset filters
        imageObj.filters = [];

        // Apply the selected filter
        switch (filterType) {
            case "grayscale":
                imageObj.filters.push(new fabric.Image.filters.Grayscale());
                break;
            case "sepia":
                imageObj.filters.push(new fabric.Image.filters.Sepia());
                break;
            case "vintage":
                imageObj.filters.push(new fabric.Image.filters.Sepia());
                imageObj.filters.push(new fabric.Image.filters.Contrast({ contrast: 0.15 }));
                imageObj.filters.push(new fabric.Image.filters.Brightness({ brightness: 0.1 }));
                break;
            case "bright":
                imageObj.filters.push(new fabric.Image.filters.Brightness({ brightness: 0.2 }));
                imageObj.filters.push(new fabric.Image.filters.Contrast({ contrast: 0.15 }));
                break;
            default:
                break;
        }

        // Apply filters and refresh the canvas
        imageObj.applyFilters();
        fabricCanvasRef.current.renderAll();
    };

    const changeAspectRatio = (ratio) => {
        setAspectRatio(ratio);
        let newWidth = 600, newHeight = 600;
        switch (ratio) {
            case "1:1":
                newWidth = 600; newHeight = 600; break;
            case "4:5":
                newWidth = 480; newHeight = 600; break;
            case "16:9":
                newWidth = 600; newHeight = 338; break;
            default:
                return;
        }
        fabricCanvasRef.current.setDimensions({ width: newWidth, height: newHeight });
        const objects = fabricCanvasRef.current.getObjects();
        if (objects.length > 0) {
            fabricCanvasRef.current.centerObject(objects[0]);
            fabricCanvasRef.current.renderAll();
        }
    };

    const removeImageBackground = async () => {
        if (!selectedImage) return;
        setProcessingBg(true);
        try {
            const objects = fabricCanvasRef.current.getObjects();
            const imageObj = objects.find(obj => obj.type === "image");
            if (!imageObj) { setProcessingBg(false); return; }

            // Get the image data
            const dataUrl = imageObj.toDataURL();
            const blob = await fetch(dataUrl).then(r => r.blob());

            // Process the image with background removal
            const processedImageBlob = await removeBackground(blob, {
                progress: (progress) => console.log(`Processing: ${progress * 100}%`),
            });

            // Create a URL for the processed image
            const processedDataUrl = URL.createObjectURL(processedImageBlob);

            // Replace the old image with the new one
            fabric.Image.fromURL(processedDataUrl, (img) => {
                fabricCanvasRef.current.remove(imageObj);
                if (img.width > 600 || img.height > 600) {
                    const scale = Math.min(600 / img.width, 600 / img.height);
                    img.scale(scale);
                }
                fabricCanvasRef.current.add(img);
                fabricCanvasRef.current.centerObject(img);
                fabricCanvasRef.current.renderAll();
                setProcessingBg(false);
            });
        } catch (error) {
            console.error("Error removing background:", error);
            setProcessingBg(false);
        }
    };

    const downloadImage = () => {
        const dataUrl = fabricCanvasRef.current.toDataURL({ format: 'png', quality: 1 });
        const link = document.createElement('a');
        link.download = 'pet-edited-image.png';
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const saveEditedImage = async () => {
        if (!selectedImage) return;
        setLoading(true);
        try {
            const dataUrl = fabricCanvasRef.current.toDataURL({ format: 'png', quality: 1 });
            const blob = await fetch(dataUrl).then(r => r.blob());
            const editedFile = new File([blob], "edited-pet-image.png", { type: "image/png" });
            const formData = new FormData();
            formData.append('original_image', selectedImage);
            formData.append('edited_image', editedFile);
            formData.append('editor_data', JSON.stringify(fabricCanvasRef.current.toJSON()));

            const token = localStorage.getItem('accessToken'); // Make sure we're using the auth token here too
            const response = await fetch(`${BACKEND_API_PORT}/api/edited-pet-images/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) throw new Error('Failed to save edited image');
            fetchRecentEdits();
            setLoading(false);
            alert('Image saved successfully!');
        } catch (error) {
            console.error("Error saving edited image:", error);
            setLoading(false);
            alert('Failed to save edited image');
        }
    };

    const clearCanvas = () => {
        if (window.confirm('Are you sure you want to clear the canvas?')) {
            fabricCanvasRef.current.clear();
            fabricCanvasRef.current.setBackgroundColor('#f0f0f0', fabricCanvasRef.current.renderAll.bind(fabricCanvasRef.current));
            setSelectedImage(null);
            setSelectedFilter(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const deleteActiveObject = () => {
        const activeObject = fabricCanvasRef.current.getActiveObject();
        if (activeObject) {
            fabricCanvasRef.current.remove(activeObject);
            fabricCanvasRef.current.renderAll();
        }
    };

    const [isPanning, setIsPanning] = useState(false);

    // Pan logic inside useEffect
    useEffect(() => {
        // ...existing initialization...

        const canvas = fabricCanvasRef.current;
        let isDragging = false;
        let lastPosX = 0;
        let lastPosY = 0;

        const handleMouseDown = (opt) => {
            if (isPanning) {
                isDragging = true;
                canvas.selection = false;
                lastPosX = opt.e.clientX;
                lastPosY = opt.e.clientY;
                canvas.defaultCursor = 'grabbing';
            }
        };

        const handleMouseMove = (opt) => {
            if (isDragging && isPanning) {
                const e = opt.e;
                const vpt = canvas.viewportTransform;
                vpt[4] += e.clientX - lastPosX;
                vpt[5] += e.clientY - lastPosY;
                canvas.requestRenderAll();
                lastPosX = e.clientX;
                lastPosY = e.clientY;
            }
        };

        const handleMouseUp = () => {
            isDragging = false;
            canvas.selection = true;
            canvas.defaultCursor = isPanning ? 'grab' : 'default';
        };

        canvas.on('mouse:down', handleMouseDown);
        canvas.on('mouse:move', handleMouseMove);
        canvas.on('mouse:up', handleMouseUp);

        // Set cursor on pan mode change
        canvas.defaultCursor = isPanning ? 'grab' : 'default';

        return () => {
            canvas.off('mouse:down', handleMouseDown);
            canvas.off('mouse:move', handleMouseMove);
            canvas.off('mouse:up', handleMouseUp);
        };
    }, [isPanning]);

    return (
        <>
            <CirclesBackground height={windowWidth} />
            <div className="min-h-screen flex flex-col bg-gradient-to-b from-[var(--background2)] to-[var(--backgroundColor)] text-white">
                <main className="flex flex-col md:flex-row p-6 space-x-0 md:space-x-6 mt-20">
                    {/* Sidebar */}
                    <div className="w-full md:w-1/4 p-4 rounded-lg shadow-lg mb-6 md:mb-0 h-[84vh] overflow-y-auto scroll-smooth text-[var(--textColor)] bg-[var(--backgroundColor)] z-10">
                        <h2 className="text-xl font-semibold mb-4">Edit Tools</h2>
                        <div className="mb-6">
                            <h3 className="font-medium mb-2">Upload Image</h3>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/*"
                                className="w-full p-2 rounded bg-[var(--background2)] text-[var(--textColor)]"
                            />
                        </div>
                        <div className="mb-6">
                            <h3 className="font-medium mb-2">Tools</h3>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setIsPanning((prev) => !prev)}
                                    className={`py-2 px-4 rounded-lg transition duration-200 ${isPanning ? 'bg-[var(--primaryColor)] text-[var(--textColor3)]' : 'bg-[var(--background2)] text-[var(--textColor)]'} hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)]`}
                                >
                                    {isPanning ? 'Hand Tool (On)' : 'Hand Tool'}
                                </button>
                                <button
                                    onClick={() => setSelectedTool('shapes')}
                                    className={`py-2 px-4 rounded-lg transition duration-200 ${selectedTool === 'shapes' ? 'bg-[var(--primaryColor)] text-[var(--textColor3)]' : 'bg-[var(--background2)] text-[var(--textColor)]'} hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)]`}
                                >Shapes</button>

                                <button
                                    onClick={() => setSelectedTool('overlays')}
                                    className={`py-2 px-4 rounded-lg transition duration-200 ${selectedTool === 'overlays' ? 'bg-[var(--primaryColor)] text-[var(--textColor3)]' : 'bg-[var(--background2)] text-[var(--textColor)]'} hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)]`}
                                >Overlays</button>
                                <button
                                    onClick={() => setSelectedTool('filters')}
                                    className={`py-2 px-4 rounded-lg transition duration-200 ${selectedTool === 'filters' ? 'bg-[var(--primaryColor)] text-[var(--textColor3)]' : 'bg-[var(--background2)] text-[var(--textColor)]'} hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)]`}
                                >Filters</button>
                            </div>
                        </div>
                        {selectedTool === 'shapes' && (
                            <div className="mb-6">
                                <h3 className="font-medium mb-2">Shapes</h3>
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={() => setSelectedShape('rect')} className={`py-2 px-4 rounded-lg transition duration-200 ${selectedShape === 'rect' ? 'bg-[var(--primaryColor)] text-[var(--textColor3)]' : 'bg-[var(--background2)] text-[var(--textColor)]'} hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)]`}>Rectangle</button>
                                    <button onClick={() => setSelectedShape('circle')} className={`py-2 px-4 rounded-lg transition duration-200 ${selectedShape === 'circle' ? 'bg-[var(--primaryColor)] text-[var(--textColor3)]' : 'bg-[var(--background2)] text-[var(--textColor)]'} hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)]`}>Circle</button>
                                    <button onClick={() => setSelectedShape('triangle')} className={`py-2 px-4 rounded-lg transition duration-200 ${selectedShape === 'triangle' ? 'bg-[var(--primaryColor)] text-[var(--textColor3)]' : 'bg-[var(--background2)] text-[var(--textColor)]'} hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)]`}>Triangle</button>
                                    <button onClick={() => setSelectedShape('star')} className={`py-2 px-4 rounded-lg transition duration-200 ${selectedShape === 'star' ? 'bg-[var(--primaryColor)] text-[var(--textColor3)]' : 'bg-[var(--background2)] text-[var(--textColor)]'} hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)]`}>Star</button>
                                </div>
                                <button onClick={addShape} className="mt-2 w-full py-2 px-4 rounded-lg bg-[var(--primary1)] text-[var(--textColor3)] hover:bg-[var(--primaryColor)] transition duration-200">Add Shape</button>
                            </div>
                        )}
                        {selectedTool === 'overlays' && (
                            <div className="mb-6">
                                <h3 className="font-medium mb-2">Pet Overlays</h3>
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={() => addOverlay('paw')} className="py-2 px-4 rounded-lg bg-[var(--background2)] text-[var(--textColor)] hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)] transition duration-200">Paw Print</button>
                                    <button onClick={() => addOverlay('hat')} className="py-2 px-4 rounded-lg bg-[var(--background2)] text-[var(--textColor)] hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)] transition duration-200">Pet Hat</button>
                                    <button onClick={() => addOverlay('collar')} className="py-2 px-4 rounded-lg bg-[var(--background2)] text-[var(--textColor)] hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)] transition duration-200">Collar</button>
                                </div>
                            </div>
                        )}
                        {selectedTool === 'filters' && (
                            <div className="mb-6">
                                <h3 className="font-medium mb-2">Filters</h3>
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={() => applyFilter(null)} className={`py-2 px-4 rounded-lg transition duration-200 ${selectedFilter === null ? 'bg-[var(--primaryColor)] text-[var(--textColor3)]' : 'bg-[var(--background2)] text-[var(--textColor)]'} hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)]`}>Normal</button>
                                    <button onClick={() => applyFilter('grayscale')} className={`py-2 px-4 rounded-lg transition duration-200 ${selectedFilter === 'grayscale' ? 'bg-[var(--primaryColor)] text-[var(--textColor3)]' : 'bg-[var(--background2)] text-[var(--textColor)]'} hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)]`}>Grayscale</button>
                                    <button onClick={() => applyFilter('sepia')} className={`py-2 px-4 rounded-lg transition duration-200 ${selectedFilter === 'sepia' ? 'bg-[var(--primaryColor)] text-[var(--textColor3)]' : 'bg-[var(--background2)] text-[var(--textColor)]'} hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)]`}>Sepia</button>
                                    <button onClick={() => applyFilter('vintage')} className={`py-2 px-4 rounded-lg transition duration-200 ${selectedFilter === 'vintage' ? 'bg-[var(--primaryColor)] text-[var(--textColor3)]' : 'bg-[var(--background2)] text-[var(--textColor)]'} hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)]`}>Vintage</button>
                                    <button onClick={() => applyFilter('bright')} className={`py-2 px-4 rounded-lg transition duration-200 ${selectedFilter === 'bright' ? 'bg-[var(--primaryColor)] text-[var(--textColor3)]' : 'bg-[var(--background2)] text-[var(--textColor)]'} hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)]`}>Bright</button>
                                </div>
                            </div>
                        )}
                        <div className="mb-6">
                            <h3 className="font-medium mb-2">Aspect Ratio</h3>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => changeAspectRatio('original')} className={`py-2 px-4 rounded-lg transition duration-200 ${aspectRatio === 'original' ? 'bg-[var(--primaryColor)] text-[var(--textColor3)]' : 'bg-[var(--background2)] text-[var(--textColor)]'} hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)]`}>Original</button>
                                <button onClick={() => changeAspectRatio('1:1')} className={`py-2 px-4 rounded-lg transition duration-200 ${aspectRatio === '1:1' ? 'bg-[var(--primaryColor)] text-[var(--textColor3)]' : 'bg-[var(--background2)] text-[var(--textColor)]'} hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)]`}>1:1</button>
                                <button onClick={() => changeAspectRatio('4:5')} className={`py-2 px-4 rounded-lg transition duration-200 ${aspectRatio === '4:5' ? 'bg-[var(--primaryColor)] text-[var(--textColor3)]' : 'bg-[var(--background2)] text-[var(--textColor)]'} hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)]`}>4:5</button>
                                <button onClick={() => changeAspectRatio('16:9')} className={`py-2 px-4 rounded-lg transition duration-200 ${aspectRatio === '16:9' ? 'bg-[var(--primaryColor)] text-[var(--textColor3)]' : 'bg-[var(--background2)] text-[var(--textColor)]'} hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)]`}>16:9</button>
                            </div>
                        </div>
                        <div className="mb-6">
                            <h3 className="font-medium mb-2">Advanced Tools</h3>
                            <button onClick={removeImageBackground} disabled={!selectedImage || processingBg} className={`w-full py-2 px-4 rounded-lg transition duration-200 ${processingBg ? 'bg-gray-500 text-gray-300 cursor-not-allowed' : 'bg-[var(--primary1)] text-[var(--textColor3)] hover:bg-[var(--primaryColor)]'}`}>
                                {processingBg ? "Processing..." : "Remove Background"}
                            </button>
                            <button onClick={deleteActiveObject} className="w-full mt-2 py-2 px-4 rounded-lg bg-[var(--c2)] text-[var(--textColor3)] hover:bg-[var(--c4)] transition duration-200">Delete Selected</button>
                            <button onClick={saveEditedImage} disabled={loading} className="w-full mt-2 py-2 px-4 rounded-lg bg-[var(--primaryColor)] text-[var(--textColor3)] hover:bg-[var(--primary1)] transition duration-200">{loading ? "Saving..." : "Save Edit"}</button>
                        </div>
                    </div>
                    {/* Main Canvas Area */}
                    <div className="w-full md:w-3/4 p-6 rounded-lg shadow-lg relative h-[84vh] overflow-y-auto scroll-smooth text-[var(--textColor)] bg-[var(--backgroundColor)]">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-bold">Pet Media Editor</h1>
                            <div className="flex gap-2">
                                <button onClick={downloadImage} className="py-2 px-4 rounded-lg bg-[var(--primaryColor)] hover:bg-[var(--primary1)] text-[var(--textColor3)] transition">Download</button>
                                <button onClick={clearCanvas} className="py-2 px-4 rounded-lg bg-[var(--c2)] hover:bg-[var(--c4)] text-[var(--textColor3)] transition">Clear</button>
                            </div>
                        </div>
                        <canvas ref={canvasRef} className="border-2 border-dashed border-[var(--primaryColor)] rounded-lg bg-[var(--background2)] w-full" style={{ height: '600px' }} />
                        {recentEdits.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-xl font-semibold mb-4">Recent Edits</h3>
                                <div className="grid grid-cols-4 gap-4">
                                    {recentEdits.map(edit => (
                                        <div key={edit.id} className="relative group cursor-pointer rounded-lg overflow-hidden">
                                            <Image src={`${BACKEND_API_PORT}${edit.edited_image}`} alt="Recent edit" width={200} height={200} className="w-full h-32 object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </main>
                <Footer />
            </div>
        </>
    );
}