import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  fetchUserDocuments,
  uploadDocument,
  deleteDocument,
  reprocessDocument,
  viewDocument,
  updateDocumentDetails
} from '../services/api';

const DOC_TYPE_INFO = {
  aadhaar: {
    label: 'Aadhaar / Identity Proof',
    category: 'identity',
    description: 'Government-issued Aadhaar card or identity proof',
    icon: '🪪',
    acceptedFormats: 'PDF, JPG, PNG'
  },
  income_certificate: {
    label: 'Income Certificate',
    category: 'income',
    description: 'Annual family income certificate issued by competent authority',
    icon: '💰',
    acceptedFormats: 'PDF, JPG, PNG'
  },
  caste_certificate: {
    label: 'Caste Certificate',
    category: 'income',
    description: 'Caste/category certificate (SC/ST/OBC/EWS) from competent authority',
    icon: '📋',
    acceptedFormats: 'PDF, JPG, PNG'
  },
  domicile_certificate: {
    label: 'Domicile Certificate',
    category: 'identity',
    description: 'State domicile / residence certificate',
    icon: '🏠',
    acceptedFormats: 'PDF, JPG, PNG'
  },
  bank_passbook: {
    label: 'Bank Passbook',
    category: 'identity',
    description: 'Bank account passbook (front page showing account holder details)',
    icon: '🏦',
    acceptedFormats: 'PDF, JPG, PNG'
  },
  marksheet_10th: {
    label: '10th Marksheet',
    category: 'education',
    description: 'Class 10 board examination marksheet / certificate',
    icon: '📄',
    acceptedFormats: 'PDF, JPG, PNG'
  },
  marksheet_12th: {
    label: '12th Marksheet',
    category: 'education',
    description: 'Class 12 board examination marksheet / certificate',
    icon: '📄',
    acceptedFormats: 'PDF, JPG, PNG'
  },
  disability_certificate: {
    label: 'Disability Certificate / UDID',
    category: 'special',
    description: 'Unique Disability ID (UDID) or certified disability certificate',
    icon: '♿',
    acceptedFormats: 'PDF, JPG, PNG'
  },
  land_records: {
    label: 'Land Holding Papers / RoR',
    category: 'special',
    description: 'Record of Rights (RoR), Khasra/Khata land ownership papers',
    icon: '🌾',
    acceptedFormats: 'PDF, JPG, PNG'
  },
  ration_card: {
    label: 'Ration Card / BPL Card',
    category: 'income',
    description: 'BPL / Antyodaya / NFSA ration card for subsidized welfare schemes',
    icon: '🍚',
    acceptedFormats: 'PDF, JPG, PNG'
  },
  birth_certificate: {
    label: 'Birth Certificate',
    category: 'special',
    description: 'Official birth certificate issued by municipal/panchayat authority',
    icon: '👶',
    acceptedFormats: 'PDF, JPG, PNG'
  },
  student_bonafide: {
    label: 'Student Bonafide / School Certificate',
    category: 'education',
    description: 'Bonafide certificate or school/college enrollment ID',
    icon: '🎓',
    acceptedFormats: 'PDF, JPG, PNG'
  },
  employment_certificate: {
    label: 'Employment / Vending Certificate',
    category: 'education',
    description: 'Town vending committee certificate or employer bonafide',
    icon: '💼',
    acceptedFormats: 'PDF, JPG, PNG'
  },
  address_proof: {
    label: 'Address / Residence Proof',
    category: 'identity',
    description: 'Utility bill, voter card, or proof of residence',
    icon: '📮',
    acceptedFormats: 'PDF, JPG, PNG'
  },
  bpl_ews_certificate: {
    label: 'BPL / EWS Certificate',
    category: 'income',
    description: 'Economically Weaker Section or Below Poverty Line certificate',
    icon: '🏷️',
    acceptedFormats: 'PDF, JPG, PNG'
  },
  widow_certificate: {
    label: 'Widow Certificate',
    category: 'special',
    description: 'Widow pension / death certificate of spouse',
    icon: '📜',
    acceptedFormats: 'PDF, JPG, PNG'
  },
  affidavit: {
    label: 'Affidavit / Self Declaration',
    category: 'special',
    description: 'Notarized affidavit or statutory self-declaration',
    icon: '🖋️',
    acceptedFormats: 'PDF, JPG, PNG'
  },
  other: {
    label: 'Other Supporting Documents',
    category: 'special',
    description: 'Any other scheme-specific supporting document',
    icon: '📁',
    acceptedFormats: 'PDF, JPG, PNG'
  },
  marriage_certificate: {
    label: 'Marriage Certificate',
    category: 'special',
    description: 'Government or registrar issued marriage certificate',
    icon: '💍',
    acceptedFormats: 'PDF, JPG, PNG'
  },
  pension_certificate: {
    label: 'Pension Certificate / PPO',
    category: 'special',
    description: 'Pension Payment Order (PPO) or pensioner ID card',
    icon: '🧓',
    acceptedFormats: 'PDF, JPG, PNG'
  },
  medical_certificate: {
    label: 'Medical Certificate',
    category: 'special',
    description: 'Medical fitness or civil surgeon health certificate',
    icon: '🏥',
    acceptedFormats: 'PDF, JPG, PNG'
  }
};

const STATUS_CONFIG = {
  Missing:      { label: 'Not Uploaded',       className: 'doc-status-missing',    icon: '○' },
  Submitted:    { label: 'Submitted',          className: 'doc-status-submitted',  icon: '⬆' },
  Processing:   { label: 'Processing',         className: 'doc-status-processing', icon: '⟳' },
  Processed:    { label: 'Processed',          className: 'doc-status-processed',  icon: '✓' },
  'Needs Review': { label: 'Needs Review',     className: 'doc-status-review',     icon: '⚠' },
  Failed:       { label: 'Processing Failed',  className: 'doc-status-failed',     icon: '✗' },
  Rejected:     { label: 'Rejected',           className: 'doc-status-failed',     icon: '✗' }
};

function getDetailLabel(key) {
  const labels = {
    aadhaar_number:       'Aadhaar No.',
    name:                 'Full Name',
    full_name:            'Full Name',
    dob:                  'Date of Birth',
    applicant_name:       'Applicant Name',
    certificate_number:   'Cert. No.',
    issue_date:           'Issue Date',
    issuing_authority:    'Issued By',
    annual_income:        'Annual Income',
    category:             'Category',
    state:                'State',
    district:             'District',
    account_holder_name:  'A/C Holder',
    bank_name:            'Bank',
    ifsc_code:            'IFSC',
    account_number:       'Account No.',
    student_name:         'Student Name',
    roll_number:          'Roll No.',
    board_university:     'Board / Univ',
    passing_year:         'Passing Year',
    marks_percentage:     'Marks / %',
    disability_type:      'Disability Type',
    disability_percentage:'Disability %',
    head_of_family:       'Head of Family',
    card_number:          'Card No.',
    card_category:        'Card Type',
    family_members_count: 'Members',
    owner_name:           'Owner Name',
    khasra_number:        'Khasra No.',
    land_area:            'Land Area',
    document_name:        'Document Name',
    holder_name:          'Holder Name',
    reference_number:     'Ref No.',
    notes:                'Notes',
  };
  return labels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function Documents() {
  const { token } = useAuth();
  const [documents,      setDocuments]      = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState('');
  const [uploadingType,  setUploadingType]  = useState(null);
  const [uploadError,    setUploadError]    = useState({});
  const [uploadSuccess,  setUploadSuccess]  = useState({});
  const [deletingId,     setDeletingId]     = useState(null);
  const [reprocessingId, setReprocessingId] = useState(null);
  const [viewingDoc,     setViewingDoc]     = useState(null);
  const fileInputRefs = useRef({});

  // Document details modal state
  const [editingDoc,     setEditingDoc]     = useState(null);
  const [detailsForm,    setDetailsForm]    = useState({});
  const [savingDetails,  setSavingDetails]  = useState(false);
  const [detailsError,   setDetailsError]   = useState('');
  const [detailsSuccess, setDetailsSuccess] = useState('');

  async function loadDocuments() {
    try {
      setLoading(true);
      setError('');
      const res = await fetchUserDocuments(token);
      if (res && res.success && Array.isArray(res.data)) {
        setDocuments(res.data);
      } else {
        setError(res?.message || 'Failed to load documents.');
      }
    } catch (err) {
      console.error('Load documents error:', err);
      setError('Unable to connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) loadDocuments();
  }, [token]);

  const handleUploadClick = (docType) => {
    if (fileInputRefs.current[docType]) {
      fileInputRefs.current[docType].click();
    }
  };

  const handleFileChange = async (e, docType) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 10 * 1024 * 1024;

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|jpg|jpeg|png)$/i)) {
      setUploadError(prev => ({ ...prev, [docType]: 'Unsupported file type. Use PDF, JPG, or PNG.' }));
      return;
    }
    if (file.size > maxSize) {
      setUploadError(prev => ({ ...prev, [docType]: 'File too large (max 10 MB).' }));
      return;
    }

    setUploadingType(docType);
    setUploadError(prev  => ({ ...prev, [docType]: '' }));
    setUploadSuccess(prev => ({ ...prev, [docType]: '' }));

    try {
      const res = await uploadDocument(file, docType, token);
      if (res && res.success) {
        const procStatus = res.data?.status || 'Submitted';
        setUploadSuccess(prev => ({
          ...prev,
          [docType]: `${DOC_TYPE_INFO[docType]?.label || docType} uploaded successfully. Processing: ${procStatus}`
        }));
        await loadDocuments();
      } else {
        setUploadError(prev => ({ ...prev, [docType]: res?.message || 'Upload failed.' }));
      }
    } catch (err) {
      setUploadError(prev => ({ ...prev, [docType]: err?.message || 'Upload failed. Please try again.' }));
    } finally {
      setUploadingType(null);
    }
  };

  const handleDelete = async (docId, docType) => {
    const label = DOC_TYPE_INFO[docType]?.label || docType;
    if (!window.confirm(`Are you sure you want to remove ${label}? You can re-upload it later.`)) return;
    setDeletingId(docId);
    try {
      const res = await deleteDocument(docId, token);
      if (res && res.success) {
        await loadDocuments();
      } else {
        setUploadError(prev => ({ ...prev, [docType]: res?.message || 'Delete failed.' }));
      }
    } catch (err) {
      setUploadError(prev => ({ ...prev, [docType]: err?.message || 'Delete failed.' }));
    } finally {
      setDeletingId(null);
    }
  };

  const handleReprocess = async (docId, docType) => {
    setReprocessingId(docId);
    setUploadSuccess(prev => ({ ...prev, [docType]: '' }));
    try {
      const res = await reprocessDocument(docId, token);
      if (res && res.success) {
        setUploadSuccess(prev => ({
          ...prev,
          [docType]: `Reprocessed. New status: ${res.data?.status || 'Updated'}`
        }));
        await loadDocuments();
      } else {
        setUploadError(prev => ({ ...prev, [docType]: res?.message || 'Reprocessing failed.' }));
      }
    } catch (err) {
      setUploadError(prev => ({ ...prev, [docType]: err?.message || 'Reprocessing failed.' }));
    } finally {
      setReprocessingId(null);
    }
  };

  const handleViewDocument = async (docId, filename) => {
    try {
      const { blob, mimeType } = await viewDocument(docId, token);
      const url = URL.createObjectURL(blob);
      setViewingDoc({ url, mimeType: mimeType || 'application/pdf', filename });
    } catch (err) {
      console.error('View document error:', err);
    }
  };

  const closeViewer = () => {
    if (viewingDoc?.url) URL.revokeObjectURL(viewingDoc.url);
    setViewingDoc(null);
  };

  // --- Document Details handlers ---
  const handleOpenDetails = (doc) => {
    setEditingDoc(doc);
    const existing = (doc.document_details && typeof doc.document_details === 'object')
      ? { ...doc.document_details }
      : {};
    setDetailsForm(existing);
    setDetailsError('');
    setDetailsSuccess('');
  };

  const handleCloseDetails = () => {
    setEditingDoc(null);
    setDetailsForm({});
    setDetailsError('');
    setDetailsSuccess('');
  };

  const handleAutofillFromOCR = () => {
    if (!editingDoc) return;
    const ext = editingDoc.extracted_data || {};
    const dt = editingDoc.doc_type || editingDoc.document_type;
    let filled = {};

    if (dt === 'aadhaar') {
      if (ext.name) filled.name = ext.name;
      if (ext.masked_aadhaar) filled.aadhaar_number = ext.masked_aadhaar;
      else if (ext.aadhaar_number) filled.aadhaar_number = ext.aadhaar_number;
      if (ext.dob) filled.dob = ext.dob;
    } else if (dt === 'income_certificate') {
      if (ext.name || ext.applicant_name) filled.applicant_name = ext.name || ext.applicant_name;
      if (ext.issuing_authority)  filled.issuing_authority  = ext.issuing_authority;
      if (ext.annual_income)      filled.annual_income      = String(ext.annual_income);
      if (ext.certificate_number) filled.certificate_number = ext.certificate_number;
    } else if (dt === 'caste_certificate') {
      if (ext.name || ext.applicant_name) filled.applicant_name = ext.name || ext.applicant_name;
      if (ext.category)           filled.category           = ext.category;
      if (ext.issuing_authority)  filled.issuing_authority  = ext.issuing_authority;
      if (ext.certificate_number) filled.certificate_number = ext.certificate_number;
    } else if (dt === 'domicile_certificate') {
      if (ext.name || ext.applicant_name) filled.applicant_name = ext.name || ext.applicant_name;
      if (ext.state)              filled.state              = ext.state;
      if (ext.district)           filled.district           = ext.district;
      if (ext.issuing_authority)  filled.issuing_authority  = ext.issuing_authority;
      if (ext.certificate_number) filled.certificate_number = ext.certificate_number;
    } else if (dt === 'bank_passbook') {
      if (ext.name)                  filled.account_holder_name = ext.name;
      if (ext.bank_name)             filled.bank_name           = ext.bank_name;
      if (ext.ifsc)                  filled.ifsc_code           = ext.ifsc;
      if (ext.masked_account_number) filled.account_number      = ext.masked_account_number;
      else if (ext.account_number)   filled.account_number      = ext.account_number;
    } else if (dt === 'marksheet_10th' || dt === 'marksheet_12th' || dt === 'student_bonafide') {
      if (ext.name)               filled.student_name       = ext.name;
      if (ext.roll_number)        filled.roll_number        = ext.roll_number;
      if (ext.board)              filled.board_university   = ext.board;
      if (ext.year)               filled.passing_year       = ext.year;
      if (ext.certificate_number) filled.certificate_number = ext.certificate_number;
    } else {
      if (ext.name)               filled.holder_name        = ext.name;
      if (ext.doc_type_label)     filled.document_name      = ext.doc_type_label;
      if (ext.certificate_number) filled.reference_number   = ext.certificate_number;
    }

    if (Object.keys(filled).length > 0) {
      setDetailsForm(prev => ({ ...prev, ...filled }));
      setDetailsSuccess('OCR data autofilled. Please review and confirm before saving.');
    } else {
      setDetailsError('No extracted OCR data available for autofill on this document.');
    }
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    if (!editingDoc?.id) return;
    setSavingDetails(true);
    setDetailsError('');
    setDetailsSuccess('');
    try {
      const res = await updateDocumentDetails(editingDoc.id, detailsForm, token);
      if (res && res.success) {
        setDetailsSuccess('Details saved successfully.');
        await loadDocuments();
        setTimeout(handleCloseDetails, 1200);
      } else {
        setDetailsError(res?.message || 'Failed to save details.');
      }
    } catch (err) {
      setDetailsError(err?.message || 'Failed to save details. Please try again.');
    } finally {
      setSavingDetails(false);
    }
  };

  // --- Type-specific details form fields ---
  const renderDetailsForm = () => {
    if (!editingDoc) return null;
    const dt = editingDoc.doc_type || editingDoc.document_type;
    const f = detailsForm;
    const setF = (key, val) => setDetailsForm(prev => ({ ...prev, [key]: val }));

    if (dt === 'aadhaar') {
      return (
        <>
          <div className="doc-form-field">
            <label className="doc-form-label">Full Name</label>
            <input
              type="text" className="doc-form-input"
              placeholder="As printed on Aadhaar card"
              value={f.name || ''}
              onChange={ev => setF('name', ev.target.value)}
            />
          </div>
          <div className="doc-form-field">
            <label className="doc-form-label">Aadhaar Number <span className="doc-form-hint">(12 digits)</span></label>
            <input
              type="text" className="doc-form-input"
              placeholder="e.g. 1234-5678-9012"
              value={f.aadhaar_number || ''}
              onChange={ev => setF('aadhaar_number', ev.target.value)}
              maxLength={14}
            />
          </div>
          <div className="doc-form-field">
            <label className="doc-form-label">Date of Birth <span className="doc-form-hint">(optional)</span></label>
            <input
              type="date" className="doc-form-input"
              value={f.dob || ''}
              onChange={ev => setF('dob', ev.target.value)}
            />
          </div>
        </>
      );
    }

    if (dt === 'income_certificate') {
      return (
        <>
          <div className="doc-form-field">
            <label className="doc-form-label">Applicant Name</label>
            <input type="text" className="doc-form-input" placeholder="Full name of applicant"
              value={f.applicant_name || ''} onChange={ev => setF('applicant_name', ev.target.value)} />
          </div>
          <div className="doc-form-field">
            <label className="doc-form-label">Certificate Number</label>
            <input type="text" className="doc-form-input" placeholder="Certificate reference number"
              value={f.certificate_number || ''} onChange={ev => setF('certificate_number', ev.target.value)} />
          </div>
          <div className="doc-form-field">
            <label className="doc-form-label">Annual Family Income <span className="doc-form-hint">(INR)</span></label>
            <input type="number" className="doc-form-input" placeholder="Annual income in rupees"
              value={f.annual_income || ''} onChange={ev => setF('annual_income', ev.target.value)} min="0" />
          </div>
          <div className="doc-form-field">
            <label className="doc-form-label">Issue Date</label>
            <input type="date" className="doc-form-input"
              value={f.issue_date || ''} onChange={ev => setF('issue_date', ev.target.value)} />
          </div>
          <div className="doc-form-field">
            <label className="doc-form-label">Issuing Authority</label>
            <input type="text" className="doc-form-input" placeholder="e.g. Tehsildar, Sub-Divisional Officer"
              value={f.issuing_authority || ''} onChange={ev => setF('issuing_authority', ev.target.value)} />
          </div>
        </>
      );
    }

    if (dt === 'caste_certificate') {
      return (
        <>
          <div className="doc-form-field">
            <label className="doc-form-label">Applicant Name</label>
            <input type="text" className="doc-form-input" placeholder="Full name of applicant"
              value={f.applicant_name || ''} onChange={ev => setF('applicant_name', ev.target.value)} />
          </div>
          <div className="doc-form-field">
            <label className="doc-form-label">Certificate Number</label>
            <input type="text" className="doc-form-input" placeholder="Certificate reference number"
              value={f.certificate_number || ''} onChange={ev => setF('certificate_number', ev.target.value)} />
          </div>
          <div className="doc-form-field">
            <label className="doc-form-label">Category</label>
            <select className="doc-form-select" value={f.category || ''} onChange={ev => setF('category', ev.target.value)}>
              <option value="">Select category</option>
              <option value="SC">SC (Scheduled Caste)</option>
              <option value="ST">ST (Scheduled Tribe)</option>
              <option value="OBC">OBC (Other Backward Class)</option>
              <option value="EWS">EWS (Economically Weaker Section)</option>
              <option value="General">General</option>
            </select>
          </div>
          <div className="doc-form-field">
            <label className="doc-form-label">Issue Date <span className="doc-form-hint">(optional)</span></label>
            <input type="date" className="doc-form-input"
              value={f.issue_date || ''} onChange={ev => setF('issue_date', ev.target.value)} />
          </div>
          <div className="doc-form-field">
            <label className="doc-form-label">Issuing Authority</label>
            <input type="text" className="doc-form-input" placeholder="e.g. Sub-Divisional Magistrate / Tehsildar"
              value={f.issuing_authority || ''} onChange={ev => setF('issuing_authority', ev.target.value)} />
          </div>
        </>
      );
    }

    if (dt === 'domicile_certificate') {
      return (
        <>
          <div className="doc-form-field">
            <label className="doc-form-label">Applicant Name</label>
            <input type="text" className="doc-form-input" placeholder="Full name of applicant"
              value={f.applicant_name || ''} onChange={ev => setF('applicant_name', ev.target.value)} />
          </div>
          <div className="doc-form-field">
            <label className="doc-form-label">Certificate Number</label>
            <input type="text" className="doc-form-input" placeholder="Certificate reference number"
              value={f.certificate_number || ''} onChange={ev => setF('certificate_number', ev.target.value)} />
          </div>
          <div className="doc-form-field">
            <label className="doc-form-label">State</label>
            <input type="text" className="doc-form-input" placeholder="State of residence"
              value={f.state || ''} onChange={ev => setF('state', ev.target.value)} />
          </div>
          <div className="doc-form-field">
            <label className="doc-form-label">District <span className="doc-form-hint">(optional)</span></label>
            <input type="text" className="doc-form-input" placeholder="District name"
              value={f.district || ''} onChange={ev => setF('district', ev.target.value)} />
          </div>
          <div className="doc-form-field">
            <label className="doc-form-label">Issue Date <span className="doc-form-hint">(optional)</span></label>
            <input type="date" className="doc-form-input"
              value={f.issue_date || ''} onChange={ev => setF('issue_date', ev.target.value)} />
          </div>
          <div className="doc-form-field">
            <label className="doc-form-label">Issuing Authority</label>
            <input type="text" className="doc-form-input" placeholder="e.g. District Magistrate / Tehsildar"
              value={f.issuing_authority || ''} onChange={ev => setF('issuing_authority', ev.target.value)} />
          </div>
        </>
      );
    }

    if (dt === 'bank_passbook') {
      return (
        <>
          <div className="doc-form-field">
            <label className="doc-form-label">Account Holder Name</label>
            <input type="text" className="doc-form-input" placeholder="Name as on bank passbook"
              value={f.account_holder_name || ''} onChange={ev => setF('account_holder_name', ev.target.value)} />
          </div>
          <div className="doc-form-field">
            <label className="doc-form-label">Bank Name</label>
            <input type="text" className="doc-form-input" placeholder="e.g. State Bank of India"
              value={f.bank_name || ''} onChange={ev => setF('bank_name', ev.target.value)} />
          </div>
          <div className="doc-form-field">
            <label className="doc-form-label">IFSC Code</label>
            <input type="text" className="doc-form-input" placeholder="e.g. SBIN0001234"
              value={f.ifsc_code || ''} onChange={ev => setF('ifsc_code', ev.target.value.toUpperCase())} maxLength={11} />
          </div>
          <div className="doc-form-field">
            <label className="doc-form-label">Account Number <span className="doc-form-hint">(stored masked)</span></label>
            <input type="text" className="doc-form-input" placeholder="Bank account number"
              value={f.account_number || ''} onChange={ev => setF('account_number', ev.target.value)} />
          </div>
        </>
      );
    }

    if (dt === 'marksheet_10th' || dt === 'marksheet_12th' || dt === 'student_bonafide') {
      return (
        <>
          <div className="doc-form-field">
            <label className="doc-form-label">Student Name</label>
            <input type="text" className="doc-form-input" placeholder="Full name of student"
              value={f.student_name || ''} onChange={ev => setF('student_name', ev.target.value)} />
          </div>
          <div className="doc-form-field">
            <label className="doc-form-label">Roll Number</label>
            <input type="text" className="doc-form-input" placeholder="Exam roll number"
              value={f.roll_number || ''} onChange={ev => setF('roll_number', ev.target.value)} />
          </div>
          <div className="doc-form-field">
            <label className="doc-form-label">Board / University</label>
            <input type="text" className="doc-form-input" placeholder="e.g. CBSE, ICSE, State Board"
              value={f.board_university || ''} onChange={ev => setF('board_university', ev.target.value)} />
          </div>
          <div className="doc-form-field">
            <label className="doc-form-label">Passing Year</label>
            <input type="text" className="doc-form-input" placeholder="e.g. 2022"
              value={f.passing_year || ''} onChange={ev => setF('passing_year', ev.target.value)} />
          </div>
          <div className="doc-form-field">
            <label className="doc-form-label">Marks / Percentage <span className="doc-form-hint">(optional)</span></label>
            <input type="text" className="doc-form-input" placeholder="e.g. 85.5% or 450/500"
              value={f.marks_percentage || ''} onChange={ev => setF('marks_percentage', ev.target.value)} />
          </div>
          <div className="doc-form-field">
            <label className="doc-form-label">Certificate / Serial Number <span className="doc-form-hint">(optional)</span></label>
            <input type="text" className="doc-form-input" placeholder="Marksheet serial number"
              value={f.certificate_number || ''} onChange={ev => setF('certificate_number', ev.target.value)} />
          </div>
        </>
      );
    }

    if (dt === 'disability_certificate') {
      return (
        <>
          <div className="doc-form-field">
            <label className="doc-form-label">Applicant Name</label>
            <input type="text" className="doc-form-input" placeholder="Full name of certificate holder"
              value={f.applicant_name || ''} onChange={ev => setF('applicant_name', ev.target.value)} />
          </div>
          <div className="doc-form-field">
            <label className="doc-form-label">Disability Type</label>
            <input type="text" className="doc-form-input" placeholder="e.g. Locomotor, Visual, Hearing"
              value={f.disability_type || ''} onChange={ev => setF('disability_type', ev.target.value)} />
          </div>
          <div className="doc-form-field">
            <label className="doc-form-label">Disability Percentage</label>
            <input type="text" className="doc-form-input" placeholder="e.g. 40%, 60%"
              value={f.disability_percentage || ''} onChange={ev => setF('disability_percentage', ev.target.value)} />
          </div>
          <div className="doc-form-field">
            <label className="doc-form-label">UDID / Certificate Number</label>
            <input type="text" className="doc-form-input" placeholder="UDID or Certificate Number"
              value={f.certificate_number || ''} onChange={ev => setF('certificate_number', ev.target.value)} />
          </div>
          <div className="doc-form-field">
            <label className="doc-form-label">Issuing Authority</label>
            <input type="text" className="doc-form-input" placeholder="e.g. Civil Surgeon / District Medical Board"
              value={f.issuing_authority || ''} onChange={ev => setF('issuing_authority', ev.target.value)} />
          </div>
          <div className="doc-form-field">
            <label className="doc-form-label">Issue Date</label>
            <input type="date" className="doc-form-input"
              value={f.issue_date || ''} onChange={ev => setF('issue_date', ev.target.value)} />
          </div>
        </>
      );
    }

    if (dt === 'ration_card' || dt === 'bpl_ews_certificate') {
      return (
        <>
          <div className="doc-form-field">
            <label className="doc-form-label">Head of Family</label>
            <input type="text" className="doc-form-input" placeholder="Name of family head"
              value={f.head_of_family || ''} onChange={ev => setF('head_of_family', ev.target.value)} />
          </div>
          <div className="doc-form-field">
            <label className="doc-form-label">Ration Card / Certificate Number</label>
            <input type="text" className="doc-form-input" placeholder="Ration card number"
              value={f.card_number || ''} onChange={ev => setF('card_number', ev.target.value)} />
          </div>
          <div className="doc-form-field">
            <label className="doc-form-label">Card Category</label>
            <select className="doc-form-select" value={f.card_category || ''} onChange={ev => setF('card_category', ev.target.value)}>
              <option value="">Select category</option>
              <option value="BPL">BPL (Below Poverty Line)</option>
              <option value="AAY">Antyodaya Anna Yojana (AAY)</option>
              <option value="PHH">Priority Household (PHH / NFSA)</option>
              <option value="EWS">Economically Weaker Section (EWS)</option>
              <option value="APL">Above Poverty Line (APL)</option>
            </select>
          </div>
          <div className="doc-form-field">
            <label className="doc-form-label">Family Members Count <span className="doc-form-hint">(optional)</span></label>
            <input type="number" className="doc-form-input" placeholder="Number of family members"
              value={f.family_members_count || ''} onChange={ev => setF('family_members_count', ev.target.value)} min="1" />
          </div>
          <div className="doc-form-field">
            <label className="doc-form-label">Issuing Authority</label>
            <input type="text" className="doc-form-input" placeholder="e.g. Food & Civil Supplies Department"
              value={f.issuing_authority || ''} onChange={ev => setF('issuing_authority', ev.target.value)} />
          </div>
          <div className="doc-form-field">
            <label className="doc-form-label">Issue Date</label>
            <input type="date" className="doc-form-input"
              value={f.issue_date || ''} onChange={ev => setF('issue_date', ev.target.value)} />
          </div>
        </>
      );
    }

    if (dt === 'land_records') {
      return (
        <>
          <div className="doc-form-field">
            <label className="doc-form-label">Land Owner Name</label>
            <input type="text" className="doc-form-input" placeholder="Owner name as per RoR"
              value={f.owner_name || ''} onChange={ev => setF('owner_name', ev.target.value)} />
          </div>
          <div className="doc-form-field">
            <label className="doc-form-label">Khasra / Khata / Survey Number</label>
            <input type="text" className="doc-form-input" placeholder="e.g. Khasra No. 124/2"
              value={f.khasra_number || ''} onChange={ev => setF('khasra_number', ev.target.value)} />
          </div>
          <div className="doc-form-field">
            <label className="doc-form-label">Total Land Area</label>
            <input type="text" className="doc-form-input" placeholder="e.g. 2.5 Acres / Hectares"
              value={f.land_area || ''} onChange={ev => setF('land_area', ev.target.value)} />
          </div>
          <div className="doc-form-field">
            <label className="doc-form-label">District / Tehsil</label>
            <input type="text" className="doc-form-input" placeholder="District or Tehsil location"
              value={f.district || ''} onChange={ev => setF('district', ev.target.value)} />
          </div>
          <div className="doc-form-field">
            <label className="doc-form-label">Issue Date</label>
            <input type="date" className="doc-form-input"
              value={f.issue_date || ''} onChange={ev => setF('issue_date', ev.target.value)} />
          </div>
        </>
      );
    }

    // Default for other documents
    return (
      <>
        <div className="doc-form-field">
          <label className="doc-form-label">Document Name</label>
          <input type="text" className="doc-form-input" placeholder="Descriptive name for this document"
            value={f.document_name || ''} onChange={ev => setF('document_name', ev.target.value)} />
        </div>
        <div className="doc-form-field">
          <label className="doc-form-label">Holder / Applicant Name <span className="doc-form-hint">(optional)</span></label>
          <input type="text" className="doc-form-input" placeholder="Name of certificate holder"
            value={f.holder_name || ''} onChange={ev => setF('holder_name', ev.target.value)} />
        </div>
        <div className="doc-form-field">
          <label className="doc-form-label">Reference / Certificate Number <span className="doc-form-hint">(optional)</span></label>
          <input type="text" className="doc-form-input" placeholder="Reference or registration number"
            value={f.reference_number || ''} onChange={ev => setF('reference_number', ev.target.value)} />
        </div>
        <div className="doc-form-field">
          <label className="doc-form-label">Issuing Authority <span className="doc-form-hint">(optional)</span></label>
          <input type="text" className="doc-form-input" placeholder="Authority who issued this document"
            value={f.issuing_authority || ''} onChange={ev => setF('issuing_authority', ev.target.value)} />
        </div>
        <div className="doc-form-field">
          <label className="doc-form-label">Issue Date <span className="doc-form-hint">(optional)</span></label>
          <input type="date" className="doc-form-input"
            value={f.issue_date || ''} onChange={ev => setF('issue_date', ev.target.value)} />
        </div>
        <div className="doc-form-field">
          <label className="doc-form-label">Notes <span className="doc-form-hint">(optional)</span></label>
          <textarea className="doc-form-textarea" placeholder="Any additional notes or details" rows={3}
            value={f.notes || ''} onChange={ev => setF('notes', ev.target.value)} />
        </div>
      </>
    );
  };

  // Group documents by document type (supporting both doc_type and document_type)
  const docByType = {};
  documents.forEach(d => {
    const k = d.doc_type || d.document_type;
    if (k) docByType[k] = d;
  });

  const totalRequired = Object.keys(DOC_TYPE_INFO).length;
  const totalUploaded = documents.filter(d => d.id && d.status !== 'Missing').length;
  const totalPending  = totalRequired - totalUploaded;

  if (loading) {
    return (
      <div className="dp-page">
        <div className="dp-inner">
          <div className="dp-loading">
            <span className="dp-loading-spinner"></span>
            Loading your documents...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dp-page">
      <div className="dp-inner">

        {/* Page Header */}
        <div className="dp-header">
          <div className="dp-header-text">
            <h1 className="dp-title">My Documents</h1>
            <p className="dp-subtitle">Manage your identity, income and eligibility documents securely.</p>
          </div>
          <div className="dp-stats-row">
            <div className="dp-stat-pill dp-stat-total">
              <span className="dp-stat-num">{totalRequired}</span>
              <span className="dp-stat-lbl">Required</span>
            </div>
            <div className="dp-stat-pill dp-stat-uploaded">
              <span className="dp-stat-num">{totalUploaded}</span>
              <span className="dp-stat-lbl">Uploaded</span>
            </div>
            <div className="dp-stat-pill dp-stat-pending">
              <span className="dp-stat-num">{totalPending}</span>
              <span className="dp-stat-lbl">Pending</span>
            </div>
          </div>
        </div>

        {error && <div className="dp-error-banner">{error}</div>}

        {/* Document Cards Grid */}
        <div className="dp-grid">
          {Object.entries(DOC_TYPE_INFO).map(([docType, info]) => {
            const doc = docByType[docType] || null;
            const isUploaded = !!(doc && doc.id && doc.status !== 'Missing');
            const statusKey = doc?.status || 'Missing';
            const statusCfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.Missing;
            const isUploading    = uploadingType  === docType;
            const isDeleting     = deletingId     === doc?.id;
            const isReprocessing = reprocessingId === doc?.id;

            const savedDetails = (doc?.document_details && typeof doc.document_details === 'object')
              ? Object.entries(doc.document_details).filter(([k, v]) => v !== null && v !== undefined && String(v).trim() !== '' && !k.endsWith('_last4'))
              : [];
            const hasSavedDetails = savedDetails.length > 0;

            return (
              <div
                key={docType}
                className={`dp-card${isUploaded ? ' dp-card--uploaded' : ''}`}
              >
                {/* Hidden file input */}
                <input
                  ref={el => fileInputRefs.current[docType] = el}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  style={{ display: 'none' }}
                  onChange={e => handleFileChange(e, docType)}
                />

                {/* Card Top: icon + title + status group */}
                <div className="dp-card-top">
                  <div className="dp-icon-wrap">
                    <span className="dp-icon" aria-hidden="true">{info.icon}</span>
                  </div>
                  <div className="dp-card-title-area">
                    <h3 className="dp-card-name">{info.label}</h3>
                    <p className="dp-card-desc">{info.description}</p>
                  </div>
                  <div className="dp-status-group">
                    {isUploaded ? (
                      <>
                        <span className="dp-status-badge dp-status-uploaded" title="Document file uploaded successfully">
                          ✓ Uploaded
                        </span>
                        {doc.status && doc.status !== 'Missing' && doc.status !== 'Submitted' && (
                          <span
                            className={`dp-status-badge dp-status-proc ${statusCfg.className}`}
                            title={`Processing Status: ${statusCfg.label}`}
                          >
                            {statusCfg.icon} {statusCfg.label}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="dp-status-badge doc-status-missing" title="Document not uploaded">
                        ○ Not Uploaded
                      </span>
                    )}
                  </div>
                </div>

                {/* Filename row (if uploaded) */}
                {isUploaded && doc?.original_filename && (
                  <div className="dp-file-row">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <span className="dp-file-name" title={doc.original_filename}>
                      {doc.original_filename.length > 32
                        ? doc.original_filename.substring(0, 29) + '...'
                        : doc.original_filename}
                    </span>
                  </div>
                )}

                {/* Feedback messages */}
                {uploadSuccess[docType] && <div className="dp-msg dp-msg--success">{uploadSuccess[docType]}</div>}
                {uploadError[docType]   && <div className="dp-msg dp-msg--error">{uploadError[docType]}</div>}

                {/* Saved details mini-display */}
                {hasSavedDetails && (
                  <div className="dp-details-box">
                    <span className="dp-details-label">Saved Details</span>
                    <div className="dp-details-grid">
                      {savedDetails.slice(0, 6).map(([key, val]) => (
                        <div key={key} className="dp-detail-row">
                          <span className="dp-detail-key">{getDetailLabel(key)}</span>
                          <span className="dp-detail-val">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Card Actions */}
                <div className="dp-card-actions">
                  {/* Upload / Replace */}
                  <button
                    type="button"
                    className={`dp-btn dp-btn--primary${isUploaded ? ' dp-btn--replace' : ''}`}
                    onClick={() => handleUploadClick(docType)}
                    disabled={isUploading}
                    title={isUploaded ? `Replace ${info.label}` : `Upload ${info.label}`}
                  >
                    {isUploading ? (
                      <><span className="dp-spinner" aria-hidden="true"></span>Uploading...</>
                    ) : isUploaded ? (
                      <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>Replace</>
                    ) : (
                      <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>Upload</>
                    )}
                  </button>

                  {/* Add / Edit Details — available for every uploaded document */}
                  {isUploaded && (
                    <button
                      type="button"
                      className="dp-btn dp-btn--details"
                      onClick={() => handleOpenDetails(doc)}
                      title={hasSavedDetails ? 'Edit saved details' : 'Add document details'}
                    >
                      {hasSavedDetails ? '✏️ Edit Details' : '+ Add Details'}
                    </button>
                  )}

                  {/* View */}
                  {isUploaded && (
                    <button
                      type="button"
                      className="dp-btn dp-btn--view"
                      onClick={() => handleViewDocument(doc.id, doc.original_filename)}
                      title="View document"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      View
                    </button>
                  )}

                  {/* Retry Process for Needs Review / Failed */}
                  {isUploaded && (doc.status === 'Needs Review' || doc.status === 'Failed') && (
                    <button
                      type="button"
                      className="dp-btn dp-btn--retry"
                      onClick={() => handleReprocess(doc.id, docType)}
                      disabled={isReprocessing}
                      title="Retry OCR document processing"
                    >
                      {isReprocessing ? 'Retrying...' : 'Retry'}
                    </button>
                  )}

                  {/* Delete / Remove */}
                  {isUploaded && (
                    <button
                      type="button"
                      className="dp-btn dp-btn--delete"
                      onClick={() => handleDelete(doc.id, docType)}
                      disabled={isDeleting}
                      title="Remove document"
                    >
                      {isDeleting ? 'Removing...' : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                      )}
                    </button>
                  )}
                </div>

                {/* Card footer: format hint */}
                <div className="dp-card-footer">
                  Accepted: {info.acceptedFormats} &middot; Max 10&nbsp;MB
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Links */}
        <div className="dp-quick-links">
          <Link to="/eligibility" className="dp-quick-link">
            Check Eligibility &#8594;
          </Link>
          <Link to="/schemes" className="dp-quick-link dp-quick-link--secondary">
            Browse Schemes &#8594;
          </Link>
        </div>

      </div>

      {/* Document Details Modal */}
      {editingDoc && (
        <div className="dp-modal-overlay" onClick={handleCloseDetails} role="dialog" aria-modal="true" aria-label="Document Details">
          <div className="dp-modal" onClick={e => e.stopPropagation()}>
            <div className="dp-modal-head">
              <h3 className="dp-modal-title">
                {DOC_TYPE_INFO[editingDoc.doc_type || editingDoc.document_type]?.label || editingDoc.doc_type || editingDoc.document_type} &mdash; Details
              </h3>
              <button type="button" className="dp-modal-close" onClick={handleCloseDetails} aria-label="Close details modal">&times;</button>
            </div>
            <form onSubmit={handleSaveDetails}>
              <div className="dp-modal-body">
                {editingDoc.extracted_data && Object.keys(editingDoc.extracted_data).length > 0 && (
                  <div className="dp-autofill-bar">
                    <span>OCR data available from scan.</span>
                    <button type="button" className="dp-btn-autofill" onClick={handleAutofillFromOCR}>
                      Autofill from scan
                    </button>
                  </div>
                )}
                {detailsError   && <div className="dp-modal-msg dp-modal-msg--error">{detailsError}</div>}
                {detailsSuccess && <div className="dp-modal-msg dp-modal-msg--success">{detailsSuccess}</div>}
                {renderDetailsForm()}
              </div>
              <div className="dp-modal-foot">
                <button type="button" className="dp-btn dp-btn--cancel" onClick={handleCloseDetails} disabled={savingDetails}>Cancel</button>
                <button type="submit" className="dp-btn dp-btn--save" disabled={savingDetails}>
                  {savingDetails ? 'Saving...' : 'Save Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {viewingDoc && (
        <div className="doc-viewer-overlay" onClick={closeViewer} role="dialog" aria-modal="true" aria-label="Document Viewer">
          <div className="doc-viewer-modal" onClick={e => e.stopPropagation()}>
            <div className="doc-viewer-header">
              <h3 className="doc-viewer-title">{viewingDoc.filename}</h3>
              <button type="button" className="doc-viewer-close" onClick={closeViewer} aria-label="Close viewer">&times;</button>
            </div>
            <div className="doc-viewer-body">
              {viewingDoc.mimeType?.startsWith('image/') ? (
                <img src={viewingDoc.url} alt={viewingDoc.filename} className="doc-viewer-image" />
              ) : (
                <iframe src={viewingDoc.url} title={viewingDoc.filename} className="doc-viewer-iframe" aria-label="PDF viewer" />
              )}
            </div>
            <div className="doc-viewer-footer">
              <a href={viewingDoc.url} download={viewingDoc.filename} className="btn-doc-download">Download</a>
              <button type="button" onClick={closeViewer} className="btn-doc-close-viewer">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
