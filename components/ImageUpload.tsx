import React, { useRef, useState } from 'react';

interface ImageUploadProps {
    currentImage?: string;
    onImageSelected: (base64: string) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ currentImage, onImageSelected }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | undefined>(currentImage);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 400; // Redimensionar para no máximo 400px de largura
                const MAX_HEIGHT = 400;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.6); // Qualidade 60%
                setPreview(optimizedBase64);
                onImageSelected(optimizedBase64);
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            {preview ? (
                <img
                    src={preview}
                    alt="Foto do Apoiador"
                    className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-slate-700 shadow-xl transition-transform group-hover:scale-105"
                />
            ) : (
                <div className="w-32 h-32 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-700 shadow-xl flex flex-col items-center justify-center gap-1 transition-transform group-hover:scale-105">
                    <span className="material-symbols-outlined text-slate-400 text-5xl">person</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Sem Foto</span>
                </div>
            )}
            <div className="absolute inset-0 bg-navy-dark/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-white text-3xl">add_a_photo</span>
            </div>
            <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
            />
        </div>
    );
};

export default ImageUpload;
