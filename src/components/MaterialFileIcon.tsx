import { File, FileText } from 'lucide-react';
import { MaterialFileType } from '../types';

interface MaterialFileIconProps {
  fileType: MaterialFileType;
  className?: string;
  iconSize?: number;
}

const MaterialFileIcon = ({ fileType, className = '', iconSize = 20 }: MaterialFileIconProps) => {
  const colorClassName = fileType === 'note'
    ? 'bg-amber-50 text-amber-600'
    : fileType === 'pdf'
      ? 'bg-rose-50 text-rose-600'
      : 'bg-blue-50 text-blue-600';

  return (
    <div className={`rounded-xl flex items-center justify-center ${colorClassName} ${className}`.trim()}>
      {fileType === 'note' ? <FileText size={iconSize} /> : <File size={iconSize} />}
    </div>
  );
};

export default MaterialFileIcon;
