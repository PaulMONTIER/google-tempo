'use client';

import { DriveFilePicker } from './DriveFilePicker';
import { DriveFile } from '@/types/integrations';

interface DrivePickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (files: DriveFile[]) => void;
}

export function DrivePickerModal({ isOpen, onClose, onSelect }: DrivePickerModalProps) {
    if (!isOpen) return null;

    return (
        <DriveFilePicker
            onClose={onClose}
            onFilesSelected={onSelect}
            maxFiles={5}
        />
    );
}
