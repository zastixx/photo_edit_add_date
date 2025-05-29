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

// Helper component for tooltips
const Tooltip = ({ children, text }: { children: React.ReactNode; text: string }) => {
  return (
    <div className="group relative">
      {children}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 left-1/2 -translate-x-1/2 
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

    // Add date overlay with updated format
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(10, canvas.height - 40, 150, 30);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(
      formatDate(selectedDate),
      20,
      canvas.height - 20
    );

    setFinalImage(canvas.toDataURL('image/png'));
  }, [imageSrc, croppedAreaPixels, selectedDate, cropShape, rotation]);

  return (
    <div className="flex flex-col gap-8 items-center w-full max-w-5xl mx-auto p-6">
      {/* Upload Section */}
      <div className="w-full max-w-md text-center">
        <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors relative">
          <Tooltip text="Click here to upload your image. We support JPG, PNG, and WebP formats">
            <label className="block text-lg font-medium mb-4 cursor-pointer">
              Upload Your Image
              <input 
                type="file" 
                accept="image/*" 
                onChange={onFileChange}
                className="w-full file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 
                         file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 
                         hover:file:bg-blue-100 transition-all cursor-pointer" 
              />
            </label>
          </Tooltip>
          <p className="mt-2 text-sm text-gray-500">Supported formats: JPG, PNG, WebP</p>
        </div>
      </div>
      
      {imageSrc ? (
        <>
          {/* Image Editor Section */}
          <div className="w-full bg-gray-50 rounded-xl shadow-lg overflow-hidden">
            {/* Cropper Container with Instructions */}
            <div className="relative">
              <div className="w-full max-w-4xl mx-auto aspect-[16/9] bg-gray-900">
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
              {/* Overlay Instructions */}
              <div className="absolute top-4 left-4 bg-black/70 text-white px-4 py-2 rounded-lg text-sm pointer-events-none">
                ⭐ Tips:
                <ul className="mt-1 list-disc list-inside opacity-90">
                  <li>Drag to move the crop area</li>
                  <li>Scroll to zoom in/out</li>
                  <li>Use controls below to adjust</li>
                </ul>
              </div>
            </div>

            {/* Controls Section with Tooltips */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  <div>
                    <Tooltip text="Choose between rectangular or circular crop shape for your image">
                      <label className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Crop Shape</span>
                        <span className="text-xs text-gray-500">{cropShape === 'rect' ? 'Rectangle' : 'Circle'}</span>
                      </label>
                    </Tooltip>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setCropShape('rect')}
                        className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                          cropShape === 'rect' 
                            ? 'border-blue-500 bg-blue-50 text-blue-700' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        Rectangle
                      </button>
                      <button
                        onClick={() => setCropShape('round')}
                        className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                          cropShape === 'round' 
                            ? 'border-blue-500 bg-blue-50 text-blue-700' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        Circle
                      </button>
                    </div>
                  </div>

                  <div>
                    <Tooltip text="Select a preset aspect ratio or use free-form cropping">
                      <label className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Aspect Ratio</span>
                        <span className="text-xs text-gray-500">
                          {aspectRatio ? (aspectRatio === 1 ? '1:1' : aspectRatio > 1 ? 'Landscape' : 'Portrait') : 'Free'}
                        </span>
                      </label>
                    </Tooltip>
                    <select 
                      value={aspectRatio || 'free'}
                      onChange={(e) => {
                        const value = e.target.value;
                        setAspectRatio(value === 'free' ? null : Number(value));
                      }}
                      className="w-full px-4 py-2.5 border rounded-lg bg-white hover:border-gray-300 transition-colors"
                    >
                      <option value="free">Free Form</option>
                      <option value="1">Square (1:1)</option>
                      <option value="1.7778">Landscape (16:9)</option>
                      <option value="0.5625">Portrait (9:16)</option>
                      <option value="1.3333">Classic (4:3)</option>
                    </select>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <div>
                    <Tooltip text="Adjust zoom level to focus on specific areas">
                      <label className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Zoom</span>
                        <span className="text-xs text-gray-500">{zoom.toFixed(1)}x</span>
                      </label>
                    </Tooltip>
                    <input 
                      type="range" 
                      value={zoom} 
                      min={1} 
                      max={3} 
                      step={0.1} 
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>

                  <div>
                    <Tooltip text="Rotate your image to adjust the orientation">
                      <label className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Rotation</span>
                        <span className="text-xs text-gray-500">{rotation}°</span>
                      </label>
                    </Tooltip>
                    <input 
                      type="range" 
                      value={rotation} 
                      min={0} 
                      max={360} 
                      step={1} 
                      onChange={(e) => setRotation(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>

                  <div>
                    <Tooltip text="Select the date to be added to your image (format: YYYY/MM/DD)">
                      <label className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Date</span>
                        <span className="text-xs text-gray-500">YYYY/MM/DD</span>
                      </label>
                    </Tooltip>
                    <DatePicker
                      selected={selectedDate}
                      onChange={(date) => setSelectedDate(date)}
                      dateFormat="yyyy/MM/dd"
                      className="w-full px-4 py-2.5 border rounded-lg hover:border-gray-300 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons with Explanation */}
              <div className="flex flex-col items-center mt-8">
                <Tooltip text="Click to generate your final image with the date stamp">
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full
                             transition-all text-lg font-medium shadow-lg hover:shadow-xl
                             transform hover:-translate-y-0.5 active:translate-y-0"
                    onClick={createFinalImage}
                  >
                    Generate Image
                  </button>
                </Tooltip>
                <p className="text-sm text-gray-500 mt-2">Click to apply your changes and add the date</p>
              </div>
            </div>
          </div>

          {/* Result Section */}
          {finalImage && (
            <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-4">
                <img 
                  src={finalImage} 
                  alt="Final" 
                  className="w-full rounded-lg" 
                />
              </div>
              <div className="p-4 bg-gray-50 border-t flex flex-col items-center">
                <Tooltip text="Save your edited image to your device">
                  <a
                    href={finalImage}
                    download={`photo_${selectedDate ? formatDate(selectedDate).replace(/\//g, '-') : 'edited'}.png`}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full
                             transition-all text-base font-medium shadow-md hover:shadow-lg
                             flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Download Image
                  </a>
                </Tooltip>
                <p className="text-sm text-gray-500 mt-2">Your image will be saved with the date stamp</p>
              </div>
            </div>
          )}
        </>
      ) : (
        // Empty State with Instructions
        <div className="text-center text-gray-500 max-w-md mx-auto">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">How to Use</h2>
            <ol className="text-left space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="font-bold">1.</span>
                <span>Upload your image using the button above</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">2.</span>
                <span>Adjust the crop area, rotation, and zoom as needed</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">3.</span>
                <span>Choose your preferred crop shape and aspect ratio</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">4.</span>
                <span>Select the date to add to your image</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">5.</span>
                <span>Generate and download your finished image</span>
              </li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoEditor;
