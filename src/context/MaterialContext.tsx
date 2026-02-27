import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Material } from '../types/app';
import { materialApi } from '../api/materialApi';
import { subscribeToMaterials } from '../services/realtimeService';
import { adaptMaterial } from '../utils/adapters';

interface MaterialContextType {
  materials: Material[];
  addMaterial: (material: Omit<Material, 'id' | 'createdAt'>) => Promise<void>;
  updateMaterial: (id: string, material: Partial<Omit<Material, 'id' | 'createdAt'>>) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
  getMaterialsByLecture: (lectureId: string, sectionId?: string) => Material[];
  loading: boolean;
}

const MaterialContext = createContext<MaterialContextType | undefined>(undefined);

export const MaterialProvider = ({ children }: { children: ReactNode }) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMaterials = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const data = await materialApi.getAll();
      setMaterials(data.map(adaptMaterial));
    } catch (err) {
      console.error('Failed to load materials:', err);
      throw err;
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => { loadMaterials(true); }, [loadMaterials]);

  useEffect(() => {
    const sub = subscribeToMaterials(() => loadMaterials());
    return () => { sub.unsubscribe(); };
  }, [loadMaterials]);

  const addMaterial = useCallback(async (m: Omit<Material, 'id' | 'createdAt'>) => {
    await materialApi.create({
      title: m.title,
      content: m.content || null,
      file_url: m.fileUrl || null,
      file_name: m.fileName || null,
      file_type: m.fileType,
      lecture_id: m.lectureId || null,
      section_id: m.sectionId || null,
    });
    await loadMaterials();
  }, [loadMaterials]);

  const updateMaterial = useCallback(async (id: string, m: Partial<Omit<Material, 'id' | 'createdAt'>>) => {
    const updates: Record<string, unknown> = {};
    if (m.title !== undefined) updates.title = m.title;
    if (m.content !== undefined) updates.content = m.content || null;
    if (m.fileUrl !== undefined) updates.file_url = m.fileUrl || null;
    if (m.fileName !== undefined) updates.file_name = m.fileName || null;
    if (m.fileType !== undefined) updates.file_type = m.fileType;
    if (m.lectureId !== undefined) updates.lecture_id = m.lectureId || null;
    if (m.sectionId !== undefined) updates.section_id = m.sectionId || null;
    await materialApi.update(id, updates);
    await loadMaterials();
  }, [loadMaterials]);

  const deleteMaterial = useCallback(async (id: string) => {
    await materialApi.delete(id);
    await loadMaterials();
  }, [loadMaterials]);

  const getMaterialsByLecture = useCallback(
    (lectureId: string, sectionId?: string) =>
      materials.filter(m => m.lectureId === lectureId && (!sectionId || m.sectionId === sectionId)),
    [materials]
  );

  return (
    <MaterialContext.Provider value={{ materials, addMaterial, updateMaterial, deleteMaterial, getMaterialsByLecture, loading }}>
      {children}
    </MaterialContext.Provider>
  );
};

export const useMaterialContext = () => {
  const ctx = useContext(MaterialContext);
  if (!ctx) throw new Error('useMaterialContext must be used within a MaterialProvider');
  return ctx;
};
