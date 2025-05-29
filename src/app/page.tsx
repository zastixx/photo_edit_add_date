"use client";
import PhotoEditor from "./PhotoEditor";

export default function Home() {
  return (
    <div className="flex flex-col items-center min-h-screen p-8 gap-8">
      <h1 className="text-2xl font-bold mb-4">Photo Edit & Add Date</h1>
      <PhotoEditor />
    </div>
  );
}
