"use client";
import React, { useState, useCallback, useRef } from "react";
import Cropper from "react-easy-crop";
import DatePicker from "react-datepicker";
import html2canvas from "html2canvas";
import "react-datepicker/dist/react-datepicker.css";

interface CroppedAreaPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Tooltip component with mobile support
const Tooltip = ({ children, text }: { children: React.ReactNode; text: string }) => {
  return (
    <div className="group relative">
      {children}
      <div className="hidden md:block opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 left-1/2 -translate-x-1/2 
                    px-3 py-2 bg-gray-900 text-white text-xs rounded-lg w-48 text-center pointer-events-none">
        {text}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
      </div>
    </div>
  );
};

const PhotoEditor = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [cropShape, setCropShape] = useState<'rect' | 'round'>('rect');
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [showTouchControls, setShowTouchControls] = useState(true);
  const cropperRef = useRef<HTMLDivElement>(null);

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  const onCropComplete = useCallback((_: unknown, croppedAreaPixels: CroppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result as string);
        setFinalImage(null);
      });
      reader.readAsDataURL(file);
    }
  };

  const createFinalImage = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels || !selectedDate) return;

    const image = new Image();
    image.src = imageSrc;
    
    await new Promise((resolve) => {
      image.onload = resolve;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    // Apply rotation and cropping
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );

    ctx.restore();

    // Apply circular mask if needed
    if (cropShape === 'round') {
      ctx.globalCompositeOperation = 'destination-in';
      ctx.beginPath();
      ctx.arc(
        canvas.width / 2,
        canvas.height / 2,
        Math.min(canvas.width, canvas.height) / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }

    // Add date overlay with updated format and larger size
    const fontSize = Math.min(canvas.width * 0.05, 32); // Responsive font size
    const padding = fontSize * 0.75;
    const dateText = formatDate(selectedDate);
    
    ctx.font = `bold ${fontSize}px Arial`;
    const textMetrics = ctx.measureText(dateText);
    const textWidth = textMetrics.width;
    
    // Background rectangle with padding
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(
      padding, 
      canvas.height - (fontSize + padding * 2), 
      textWidth + padding * 2, 
      fontSize + padding * 2
    );
    
    // Date text
    ctx.fillStyle = 'white';
    ctx.fillText(
      dateText,
      padding * 2,
      canvas.height - padding
    );

    setFinalImage(canvas.toDataURL('image/png'));
  }, [imageSrc, croppedAreaPixels, selectedDate, cropShape, rotation]);

  return (
    <div className="flex flex-col gap-4 md:gap-8 items-center w-full max-w-5xl mx-auto p-2 md:p-6">
      {/* Mobile Header */}
      <div className="w-full text-center md:hidden">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Photo Editor</h1>
        <p className="text-sm text-gray-500">Edit, crop and add date to your photos</p>
      </div>

      {/* Upload Section - Enhanced for mobile */}
      <div className="w-full max-w-md text-center">
        <div className="relative p-4 md:p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-800 transition-colors">
          <input 
            type="file" 
            accept="image/*" 
            onChange={onFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
          />
          <div className="space-y-2">
            <div className="flex justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700">Tap to upload image</p>
            <p className="text-xs text-gray-500">JPG, PNG, WebP</p>
          </div>
        </div>
      </div>

      {imageSrc ? (
        <>
          <div className="w-full bg-gray-50 rounded-xl shadow-lg overflow-hidden">
            {/* Cropper Container */}
            <div className="relative">
              <div className="w-full aspect-square md:aspect-[16/9] bg-gray-900">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={aspectRatio || undefined}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                  onCropComplete={onCropComplete}
                  cropShape={cropShape}
                  showGrid={true}
                  objectFit="contain"
                />
              </div>

              {/* Dismissible Touch Controls */}
              {showTouchControls && (
                <div 
                  className="md:hidden fixed bottom-4 left-4 right-4 bg-black/90 backdrop-blur-sm text-white 
                           px-4 py-3 rounded-2xl text-xs shadow-lg z-50 animate-fade-in"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">✨</span>
                      <span className="font-medium">Touch Controls</span>
                    </div>
                    <button 
                      onClick={() => setShowTouchControls(false)}
                      className="text-white/80 hover:text-white p-1"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div className="flex items-center gap-2 text-white/90">
                      <span>👆</span>
                      <span>Drag image</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/90">
                      <span>🔄</span>
                      <span>Rotate: 2 fingers</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/90">
                      <span>👌</span>
                      <span>Pinch to zoom</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/90">
                      <span>✨</span>
                      <span>Use buttons below</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Help Button (shows when instructions are dismissed) */}
              {!showTouchControls && (
                <button
                  onClick={() => setShowTouchControls(true)}
                  className="md:hidden fixed bottom-4 right-4 bg-black/90 text-white p-3 rounded-full shadow-lg z-50"
                >
                  <span className="text-lg">❔</span>
                </button>
              )}
            </div>

            {/* Mobile-optimized Controls */}
            <div className="p-3 md:p-6">
              {/* Quick Actions Bar */}
              <div className="md:hidden flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                <button
                  onClick={() => setRotation(prev => (prev + 90) % 360)}
                  className="flex-none px-4 py-2 bg-gray-100 rounded-full text-sm font-medium flex items-center gap-2"
                >
                  <span>🔄</span> Rotate
                </button>
                <button
                  onClick={() => setZoom(prev => Math.min(prev + 0.1, 3))}
                  className="flex-none px-4 py-2 bg-gray-100 rounded-full text-sm font-medium flex items-center gap-2"
                >
                  <span>🔍</span> Zoom
                </button>
                <button
                  onClick={() => setZoom(1)}
                  className="flex-none px-4 py-2 bg-gray-100 rounded-full text-sm font-medium flex items-center gap-2"
                >
                  <span>↩️</span> Reset
                </button>
              </div>

              {/* Simplified Mobile Controls */}
              <div className="space-y-4">
                {/* Shape Controls */}
                <div className="bg-gray-900 p-4 rounded-lg shadow-sm text-white">
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setCropShape('rect')}
                      className={`flex-1 py-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                        cropShape === 'rect' 
                          ? 'border-white bg-gray-800 text-white' 
                          : 'border-gray-700 text-gray-400'
                      }`}
                    >
                      <span>◻️</span>
                      <span>Rectangle</span>
                    </button>
                    <button
                      onClick={() => setCropShape('round')}
                      className={`flex-1 py-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                        cropShape === 'round' 
                          ? 'border-white bg-gray-800 text-white' 
                          : 'border-gray-700 text-gray-400'
                      }`}
                    >
                      <span>⭕</span>
                      <span>Circle</span>
                    </button>
                  </div>

                  {/* Aspect Ratio */}
                  <select 
                    value={aspectRatio || 'free'}
                    onChange={(e) => {
                      const value = e.target.value;
                      setAspectRatio(value === 'free' ? null : Number(value));
                    }}
                    className="w-full py-3 px-4 border border-gray-700 rounded-lg bg-gray-800 text-white text-center appearance-none"
                  >
                    <option value="free">Free Crop</option>
                    <option value="1">Square (1:1)</option>
                    <option value="1.7778">Landscape (16:9)</option>
                    <option value="0.5625">Portrait (9:16)</option>
                    <option value="1.3333">Classic (4:3)</option>
                  </select>
                </div>

                {/* Date Picker - Mobile Optimized */}
                <div className="bg-gray-900 p-4 rounded-lg shadow-sm">
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    dateFormat="yyyy/MM/dd"
                    className="w-full py-3 px-4 border rounded-lg text-center"
                    wrapperClassName="w-full"
                  />
                </div>

                {/* Generate Button */}
                <button
                  onClick={createFinalImage}
                  className="w-full bg-gray-900 text-white py-4 rounded-xl text-lg font-medium
                           active:scale-95 transition-transform flex items-center justify-center gap-2
                           shadow-lg hover:bg-black"
                >
                  <span>✨</span>
                  Generate Image
                </button>
              </div>
            </div>
          </div>

          {/* Result Section - Mobile Optimized */}
          {finalImage && (
            <div className="w-full bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-4">
                <img 
                  src={finalImage} 
                  alt="Final" 
                  className="w-full rounded-lg shadow-sm" 
                />
              </div>
              <div className="p-4 bg-gray-50 border-t">
                <a
                  href={finalImage}
                  download={`photo_${selectedDate ? formatDate(selectedDate).replace(/\//g, '-') : 'edited'}.png`}
                  className="w-full bg-green-600 text-white py-4 rounded-xl text-lg font-medium
                           active:scale-95 transition-transform flex items-center justify-center gap-2
                           shadow-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Save Image
                </a>
              </div>
            </div>
          )}
        </>
      ) : (
        // Enhanced Empty State for Mobile
        <div className="text-center text-gray-500 max-w-md mx-auto p-4">
          <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
            <div className="flex justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-700">Get Started</h2>
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3">
                <span className="flex-none w-8 h-8 bg-gray-100 text-gray-900 rounded-full flex items-center justify-center">1</span>
                <span>Upload your photo</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex-none w-8 h-8 bg-gray-100 text-gray-900 rounded-full flex items-center justify-center">2</span>
                <span>Adjust the crop area</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex-none w-8 h-8 bg-gray-100 text-gray-900 rounded-full flex items-center justify-center">3</span>
                <span>Choose shape & date</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex-none w-8 h-8 bg-gray-100 text-gray-900 rounded-full flex items-center justify-center">4</span>
                <span>Generate & save</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoEditor;
