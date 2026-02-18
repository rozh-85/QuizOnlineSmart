import { FileText, Link as LinkIcon, ChevronRight } from 'lucide-react';
import { Card } from './ui';
import { Material } from '../types';
import MaterialFileIcon from './MaterialFileIcon';

interface MaterialsViewProps {
  materials: Material[];
}

const MaterialsView = ({ materials }: MaterialsViewProps) => {
  if (materials.length === 0) return null;

  return (
    <div className="space-y-6 mt-12 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
          <FileText size={20} />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Learning Materials</h2>
          <p className="text-sm font-medium text-slate-500">Study these notes before starting the quiz</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {materials.map((material) => (
          <Card key={material.id} className="p-5 hover:bg-slate-50 transition-all border-slate-100 group">
            <div className="flex items-start gap-4">
              <MaterialFileIcon fileType={material.fileType} className="w-10 h-10 shrink-0" iconSize={20} />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors truncate">
                  {material.title}
                </h3>
                <p className="text-xs font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">
                  {material.fileType === 'note' ? 'Lecture Note' : material.fileType.toUpperCase()}
                </p>
                
                {material.fileType === 'note' ? (
                  <div className="mt-3 p-3 rounded-lg bg-white border border-slate-100 text-sm text-slate-600 leading-relaxed max-h-32 overflow-y-auto font-medium">
                    {material.content}
                  </div>
                ) : (
                  <a 
                    href={material.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center justify-between p-3 rounded-lg bg-white border border-slate-100 text-sm font-bold text-primary-600 hover:border-primary-200 transition-all"
                  >
                    <span className="truncate flex items-center gap-2">
                       <LinkIcon size={14} />
                       {material.fileName || 'Open Document'}
                    </span>
                    <ChevronRight size={14} />
                  </a>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MaterialsView;
