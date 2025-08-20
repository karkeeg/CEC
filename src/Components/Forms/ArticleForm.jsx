import React, { useEffect, useState } from 'react';
import supabase from '../../supabaseConfig/supabaseClient';

const ArticleForm = ({ onSuccess, onClose, article, onDelete, currentUser }) => {
  const [summary, setSummary] = useState('');
  const [title, setTitle] = useState('');
  const [full_content, setFullContent] = useState('');
  const [image, setImage] = useState(null); // new uploaded image file
  const [existingImageUrl, setExistingImageUrl] = useState(null); // existing image url (edit mode)
  const [slug, setSlug] = useState('');
  const [files, setFiles] = useState([]); // new files to upload
  const [existingFiles, setExistingFiles] = useState([]); // existing file urls (edit mode)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (article) {
      setTitle(article.title || '');
      setSlug(article.slug || '');
      setSummary(article.summary || '');
      setFullContent(article.full_content || '');
      setExistingImageUrl(article.image || null);
      let arr = article.files;
      try {
        if (typeof arr === 'string') arr = JSON.parse(arr);
      } catch {}
      if (!Array.isArray(arr)) arr = [];
      setExistingFiles(arr);
      setFiles([]);
      setImage(null);
    }
  }, [article]);

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleFilesChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const uploadFile = async (file, folder) => {
    if (!file) return null;
    const filePath = `article/${folder}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('article')
      .upload(filePath, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('article').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let imageUrl = existingImageUrl || null;
      if (image) {
        imageUrl = await uploadFile(image, 'images');
      }

      let fileUrls = existingFiles || [];
      if (files.length > 0) {
        const uploaded = [];
        for (const file of files) {
          const url = await uploadFile(file, 'files');
          uploaded.push(url);
        }
        fileUrls = uploaded; // replace all files if uploading new set
      }

      if (article) {
        const { error: updateError } = await supabase
          .from('articles')
          .update({ summary, title, full_content, image: imageUrl, slug, files: fileUrls })
          .eq('id', article.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('articles')
          .insert([{ summary, title, full_content, image: imageUrl, slug, files: fileUrls }]);
        if (insertError) throw insertError;
      }

      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      console.error('Error adding article:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!article) return;
    if (!window.confirm('Are you sure you want to delete this article?')) return;
    setLoading(true);
    try {
      const { error: delError } = await supabase.from('articles').delete().eq('id', article.id);
      if (delError) throw delError;
      if (onDelete) onDelete();
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <input
        name="title"
        placeholder="Title*"
        className="border border-gray-300 rounded px-3 py-2 w-full"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <input
        name="slug"
        placeholder="Slug*"
        className="border border-gray-300 rounded px-3 py-2 w-full"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        required
      />
      <textarea
        name="summary"
        placeholder="Summary*"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        required
        rows="2"
        className="md:col-span-2 border border-gray-300 rounded px-3 py-2 w-full"
      ></textarea>
      <textarea
        name="full_content"
        placeholder="Full Content*"
        value={full_content}
        onChange={(e) => setFullContent(e.target.value)}
        required
        rows="4"
        className="md:col-span-2 border border-gray-300 rounded px-3 py-2 w-full"
      ></textarea>
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700">Image:</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {existingImageUrl && (
          <div className="mt-2 text-xs text-gray-600">Current image: <a href={existingImageUrl} target="_blank" rel="noreferrer" className="underline">view</a></div>
        )}
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700">Files (Multiple):</label>
        <input
          type="file"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files))}
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {existingFiles && existingFiles.length > 0 && (
          <div className="text-xs text-gray-600 mt-2">Existing files: {existingFiles.map((u, i) => (
            <a key={i} href={u} target="_blank" rel="noreferrer" className="underline mr-2">File {i+1}</a>
          ))}</div>
        )}
      </div>
      {error && <p className="text-red-500 text-sm md:col-span-2">Error: {error}</p>}
      <div className="md:col-span-2 flex justify-end gap-2 mt-4">
        <button type="button" onClick={onClose || onSuccess} className="bg-gray-300 px-4 py-2 rounded" disabled={loading}>Cancel</button>
        {article && (
          <button type="button" onClick={handleDelete} className="bg-red-600 text-white px-4 py-2 rounded disabled:bg-gray-400" disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          {loading ? (article ? 'Updating...' : 'Adding...') : (article ? 'Update' : 'Add Article')}
        </button>
      </div>
    </form>
  );
};

export default ArticleForm;