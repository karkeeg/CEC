import React, { useState } from 'react';
import supabase from '../../supabaseConfig/supabaseClient';

const ArticleForm = ({ onSuccess }) => {
  const [id, setId] = useState('');
  const [summary, setSummary] = useState('');
  const [title, setTitle] = useState('');
  const [full_content, setFullContent] = useState('');
  const [image, setImage] = useState(null);
  const [slug, setSlug] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      let imageUrl = null;
      if (image) {
        imageUrl = await uploadFile(image, 'images');
      }

      const fileUrls = [];
      for (const file of files) {
        const url = await uploadFile(file, 'files');
        fileUrls.push(url);
      }

      const { data, error: insertError } = await supabase
        .from('articles')
        .insert([
          {
           
            summary,
            title,
            full_content,
            image: imageUrl,
            slug,
            files: fileUrls,
          },
        ]);

      if (insertError) throw insertError;

      console.log('Article added:', data);
      onSuccess();
    } catch (err) {
      console.error('Error adding article:', err.message);
      setError(err.message);
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
          onChange={handleImageChange}
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700">Files (Multiple):</label>
        <input
          type="file"
          multiple
          onChange={handleFilesChange}
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
      {error && <p className="text-red-500 text-sm md:col-span-2">Error: {error}</p>}
      <div className="md:col-span-2 flex justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={onSuccess} // Assuming onSuccess closes the modal
          className="bg-gray-300 px-4 py-2 rounded"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          {loading ? 'Adding...' : 'Add Article'}
        </button>
      </div>
    </form>
  );
};

export default ArticleForm;