import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function CreateEvent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // 1. Base Event Details
  const [formData, setFormData] = useState({
    eventName: '',
    eventDescription: '',
    eventType: 'Normal', // 'Normal', 'Merchandise'
    category: 'Technical',
    eligibility: 'All', // 'IIIT', 'Non-IIIT', 'All'
    registrationDeadline: '',
    startDate: '',
    endDate: '',
    registrationLimit: 100,
    fee: 0,
    venue: '',
    tags: '', // will be parsed into an array on submit
    stockQuantity: 0,
    purchaseLimit: 1,
  });

  // 2. Dynamic Custom Form Fields
  const [customFields, setCustomFields] = useState([]);

  // --- Handlers for Base Info ---
  const handleBaseChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // --- Handlers for Dynamic Form Builder ---
  const addCustomField = () => {
    setCustomFields(prev => [
      ...prev,
      {
        id: Date.now().toString(), // local unique ID for keys and re-ordering
        label: '',
        type: 'text',
        options: '', // React state holds it as a string initially
        isRequired: false
      }
    ]);
  };

  const updateCustomField = (id, fieldName, value) => {
    setCustomFields(prev => prev.map(field =>
      field.id === id ? { ...field, [fieldName]: value } : field
    ));
  };

  const removeCustomField = (id) => {
    setCustomFields(prev => prev.filter(field => field.id !== id));
  };

  const moveCustomField = (index, direction) => {
    if (
      (direction === -1 && index === 0) ||
      (direction === 1 && index === customFields.length - 1)
    ) return;

    setCustomFields(prev => {
      const newFields = [...prev];
      const temp = newFields[index];
      newFields[index] = newFields[index + direction];
      newFields[index + direction] = temp;
      return newFields;
    });
  };

  // --- Submission ---
  const handleSubmit = async (e, statusOverride) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Validate Base
    if (!formData.eventName || !formData.eventDescription) {
      setMessage({ type: 'error', text: 'Please fill in Event Name and Description (*)' });
      setLoading(false);
      return;
    }

    if (formData.eventType === 'Normal') {
      if (!formData.registrationDeadline || !formData.startDate || !formData.endDate || !formData.registrationLimit || !formData.venue) {
        setMessage({ type: 'error', text: 'Please fill in all required base fields (*)' });
        setLoading(false);
        return;
      }
    }

    // Validate Custom Fields only for Normal events
    if (formData.eventType === 'Normal') {
      for (let field of customFields) {
        if (!field.label.trim()) {
          setMessage({ type: 'error', text: 'All custom fields must have a label.' });
          setLoading(false);
          return;
        }
        if ((field.type === 'dropdown' || field.type === 'checkbox') && !field.options.trim()) {
          setMessage({ type: 'error', text: `Please provide options for the '${field.label}' dropdown/checkbox field.` });
          setLoading(false);
          return;
        }
      }
    }

    // Parse data for backend
    const tagsArray = formData.tags
      .split(',')
      .map(t => t.trim())
      .filter(t => t !== '');

    const parsedCustomFields = customFields.map(field => ({
      label: field.label.trim(),
      type: field.type,
      isRequired: field.isRequired,
      options: (field.type === 'dropdown' || field.type === 'checkbox')
        ? field.options.split(',').map(o => o.trim()).filter(o => o !== '')
        : []
    }));

    const finalPayload = {
      ...formData,
      registrationLimit: formData.eventType === 'Merchandise' ? null : (Number(formData.registrationLimit) || 0),
      fee: formData.eventType === 'Merchandise' ? 0 : (Number(formData.fee) || 0),
      stockQuantity: Number(formData.stockQuantity) || 0,
      purchaseLimit: Number(formData.purchaseLimit) || 1,
      tags: tagsArray,
      status: statusOverride, // 'Draft' or 'Published'
      customFormFields: formData.eventType === 'Merchandise' ? [] : parsedCustomFields,

      // Override unnecessary fields for Merchandise
      ...(formData.eventType === 'Merchandise' && {
        category: 'Other',
        eligibility: 'All',
        venue: 'Online / Store',
        startDate: new Date().toISOString(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(), // 1 year later
        registrationDeadline: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
      })
    };

    try {
      await api.post('/events', finalPayload);

      setMessage({ type: 'success', text: `Event successfully saved as ${statusOverride}!` });
      setTimeout(() => navigate('/organiser-dashboard'), 1500);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to create event. Please try again.';
      setMessage({ type: 'error', text: errorMsg });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="bg-white p-8 rounded-xl shadow border border-gray-100 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Event Studio</h1>
            <p className="text-gray-500 mt-1">Configure your event and craft custom registration forms dynamically.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/organiser-dashboard')}
            className="text-gray-600 hover:text-gray-900 font-medium bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>

        {message.text && (
          <div className={`p-4 rounded-md shadow-sm border ${message.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
            <p className="font-semibold">{message.text}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">

          {/* Base Information Column */}
          <div className="bg-white p-8 rounded-xl shadow border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6 pb-2 border-b border-gray-100">1. Core Event Details</h2>

            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Name *</label>
                  <input type="text" name="eventName" value={formData.eventName} onChange={handleBaseChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea name="eventDescription" value={formData.eventDescription} onChange={handleBaseChange} required rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Type *</label>
                  <select name="eventType" value={formData.eventType} onChange={handleBaseChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white">
                    <option value="Normal">Normal Event</option>
                    <option value="Merchandise">Merchandise / Store</option>
                  </select>
                </div>

                {formData.eventType === 'Normal' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                      <select name="category" value={formData.category} onChange={handleBaseChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white">
                        <option value="Technical">Technical</option>
                        <option value="Cultural">Cultural</option>
                        <option value="Sports">Sports</option>
                        <option value="Social">Social</option>
                        <option value="Academic">Academic</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Eligibility *</label>
                      <select name="eligibility" value={formData.eligibility} onChange={handleBaseChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white">
                        <option value="All">All Students</option>
                        <option value="IIIT">IIIT Only</option>
                        <option value="Non-IIIT">Non-IIIT Only</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Venue *</label>
                      <input type="text" name="venue" value={formData.venue} onChange={handleBaseChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time *</label>
                      <input type="datetime-local" name="startDate" value={formData.startDate} onChange={handleBaseChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time *</label>
                      <input type="datetime-local" name="endDate" value={formData.endDate} onChange={handleBaseChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Registration Deadline *</label>
                      <input type="datetime-local" name="registrationDeadline" value={formData.registrationDeadline} onChange={handleBaseChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Registrations Limit *</label>
                      <input type="number" name="registrationLimit" min="1" value={formData.registrationLimit} onChange={handleBaseChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Registration Fee (₹)</label>
                      <input type="number" name="fee" min="0" value={formData.fee} onChange={handleBaseChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                  <input type="text" name="tags" placeholder="e.g. hackathon, coding, ai" value={formData.tags} onChange={handleBaseChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Custom Form Builder Column - Only visible for Normal events */}
          {formData.eventType === 'Normal' && (
            <div className="bg-white p-8 rounded-xl shadow border border-gray-100">
              <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-100">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">2. Custom Registration Form</h2>
                  <p className="text-sm text-gray-500 mt-1">Add dynamic fields that participants must fill out to register.</p>
                </div>
                <button
                  type="button"
                  onClick={addCustomField}
                  className="inline-flex items-center bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold py-2 px-4 rounded-lg transition-colors border border-indigo-200"
                >
                  + Add Custom Field
                </button>
              </div>

              <div className="space-y-4">
                {customFields.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg">
                    <p className="text-gray-500">No custom fields added. Participants will only provide their profile data.</p>
                  </div>
                ) : (
                  customFields.map((field, index) => (
                    <div key={field.id} className="relative p-5 bg-gray-50 border border-gray-200 rounded-lg shadow-sm group">

                      {/* Reorder and Delete Controls */}
                      <div className="absolute top-4 right-4 flex space-x-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => moveCustomField(index, -1)} disabled={index === 0} className="p-1.5 text-gray-500 hover:text-indigo-600 bg-white border border-gray-300 rounded disabled:opacity-30 disabled:hover:text-gray-500 transition-colors" title="Move Up">↑</button>
                        <button type="button" onClick={() => moveCustomField(index, 1)} disabled={index === customFields.length - 1} className="p-1.5 text-gray-500 hover:text-indigo-600 bg-white border border-gray-300 rounded disabled:opacity-30 disabled:hover:text-gray-500 transition-colors" title="Move Down">↓</button>
                        <button type="button" onClick={() => removeCustomField(field.id)} className="p-1.5 text-red-500 hover:text-red-700 bg-white border border-red-200 hover:bg-red-50 rounded transition-colors ml-2" title="Remove">✕</button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-6">
                          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Field Label *</label>
                          <input
                            type="text"
                            placeholder="e.g. GitHub Profile Link"
                            value={field.label}
                            onChange={(e) => updateCustomField(field.id, 'label', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          />
                        </div>

                        <div className="md:col-span-4">
                          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Input Type *</label>
                          <select
                            value={field.type}
                            onChange={(e) => updateCustomField(field.id, 'type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
                          >
                            <option value="text">Short Text</option>
                            <option value="dropdown">Dropdown (Select One)</option>
                            <option value="checkbox">Checkboxes (Select Multiple)</option>
                            <option value="file">File Upload (.pdf/.png)</option>
                          </select>
                        </div>

                        <div className="md:col-span-2 flex items-center justify-start md:justify-center mt-6">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={field.isRequired}
                              onChange={(e) => updateCustomField(field.id, 'isRequired', e.target.checked)}
                              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                            />
                            <span className="text-sm font-medium text-gray-700">Required</span>
                          </label>
                        </div>

                        {(field.type === 'dropdown' || field.type === 'checkbox') && (
                          <div className="md:col-span-12">
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Options *</label>
                            <input
                              type="text"
                              placeholder="Comma separated (e.g. Option 1, Option 2, Option 3)"
                              value={field.options}
                              onChange={(e) => updateCustomField(field.id, 'options', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            />
                            <p className="text-xs text-gray-500 mt-1">Separate each option exactly with a comma.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Merchandise Settings Column */}
          {formData.eventType === 'Merchandise' && (
            <div className="bg-white p-8 rounded-xl shadow border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-6 pb-2 border-b border-gray-100">2. Merchandise Settings</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Stock Quantity *</label>
                  <input
                    type="number"
                    name="stockQuantity"
                    min="1"
                    value={formData.stockQuantity}
                    onChange={handleBaseChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Total amount available for purchase.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Purchase Limit per Participant *</label>
                  <input
                    type="number"
                    name="purchaseLimit"
                    min="1"
                    value={formData.purchaseLimit}
                    onChange={handleBaseChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum units a single participant can buy.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Global Actions */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'Draft')}
            disabled={loading}
            className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-semibold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50"
          >
            Save as Draft
          </button>

          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'Published')}
            disabled={loading}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow-sm transition duration-200 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Publish Event'}
          </button>
        </div>

      </div>
    </div>
  );
}

export default CreateEvent;