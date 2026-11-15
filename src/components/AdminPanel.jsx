import React, { useEffect, useState } from 'react';
import {
  Check,
  Clock3,
  ImagePlus,
  LogIn,
  LogOut,
  MapPin,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { TRANSLATIONS } from '../data/translations';

const MAX_PHOTO_SIZE = 10 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const emptyWaypoint = () => ({
  id: '',
  name: '',
  name_uz: '',
  lat: '',
  lng: '',
  elevation: '',
  type: 'waypoint',
  hazard: '',
  hazard_uz: '',
  slopeDeg: '',
  mineralogy: '',
  mineralogy_uz: '',
  scienceGoal: '',
  scienceGoal_uz: '',
  notes: '',
  notes_uz: '',
  sampleTarget: '',
  sampleTarget_uz: '',
  img: '',
});

const toFormWaypoint = (waypoint) => ({
  ...emptyWaypoint(),
  ...waypoint,
  lat: String(waypoint.lat ?? ''),
  lng: String(waypoint.lng ?? ''),
  elevation: String(waypoint.elevation ?? ''),
  slopeDeg: String(waypoint.slopeDeg ?? ''),
  hazard: waypoint.hazard ?? '',
  hazard_uz: waypoint.hazard_uz ?? '',
  mineralogy: waypoint.mineralogy ?? '',
  mineralogy_uz: waypoint.mineralogy_uz ?? '',
  scienceGoal: waypoint.scienceGoal ?? '',
  scienceGoal_uz: waypoint.scienceGoal_uz ?? '',
  notes: waypoint.notes ?? '',
  notes_uz: waypoint.notes_uz ?? '',
  sampleTarget: waypoint.sampleTarget ?? '',
  sampleTarget_uz: waypoint.sampleTarget_uz ?? '',
  img: waypoint.img ?? '',
});

export default function AdminPanel({
  zoneId,
  zoneName,
  waypoints,
  onSave,
  onClose,
  onRequestMapPick,
  initialCoordinates,
  startInCreateMode = false,
  lang = 'en',
}) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedWaypointId, setSelectedWaypointId] = useState(
    waypoints[0]?.id || '',
  );
  const [isCreating, setIsCreating] = useState(startInCreateMode);
  const [draft, setDraft] = useState(() =>
    toFormWaypoint(
      startInCreateMode
        ? { ...emptyWaypoint(), ...initialCoordinates }
        : waypoints[0] || emptyWaypoint(),
    )
  );
  const [photoFile, setPhotoFile] = useState(null);
  const [isPhotoDragging, setIsPhotoDragging] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('');

  const typeLabels = {
    base: t.adminTypeBase,
    science: t.adminTypeScience,
    hazard: t.adminTypeHazard,
    waypoint: t.adminTypeWaypoint,
    custom: t.adminTypeCustom,
    'primary-objective': t.adminTypePrimaryObjective,
  };
  const selectedWaypoint = waypoints.find((waypoint) =>
    waypoint.id === selectedWaypointId
  );
  const baselineDraft = toFormWaypoint(selectedWaypoint || emptyWaypoint());
  const isDirty = isCreating || photoFile !== null ||
    Object.keys(baselineDraft).some((key) => draft[key] !== baselineDraft[key]);
  const filteredWaypoints = waypoints.filter((waypoint) => {
    const query = searchTerm.trim().toLocaleLowerCase();
    const matchesSearch = !query ||
      [waypoint.name, waypoint.name_uz].some((name) =>
        (name || '').toLocaleLowerCase().includes(query)
      );
    return matchesSearch &&
      (typeFilter === 'all' || waypoint.type === typeFilter);
  });
  const photoCount = waypoints.filter((waypoint) => waypoint.img).length;
  const typeCount =
    new Set(waypoints.map((waypoint) => waypoint.type).filter(Boolean)).size;

  useEffect(() => {
    let active = true;
    const checkExistingSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Could not check the session.');
        }
        if (active) setIsAdmin(result.authenticated === true);
      } catch (authError) {
        console.error('Could not verify the saved admin session:', authError);
        if (active) setError(t.adminAuthCheckFailed);
      } finally {
        if (active) setCheckingAuth(false);
      }
    };

    checkExistingSession();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (isCreating) return;
    const selected = waypoints.find((waypoint) =>
      waypoint.id === selectedWaypointId
    );
    if (selected) setDraft(toFormWaypoint(selected));
  }, [isCreating, selectedWaypointId, waypoints]);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreviewUrl('');
      return undefined;
    }

    const previewUrl = URL.createObjectURL(photoFile);
    setPhotoPreviewUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [photoFile]);

  const closeOnEscape = (event) => {
    if (event.key === 'Escape') onClose();
  };

  useEffect(() => {
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  const handleSignIn = async (event) => {
    event.preventDefault();

    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Sign-in failed.');
      setIsAdmin(true);
      setPassword('');
    } catch (authError) {
      console.error('Admin sign-in failed:', authError);
      setError(t.adminLoginFailed);
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error('Sign-out failed.');
      setIsAdmin(false);
      setIsCreating(false);
      setPhotoFile(null);
      setDraft(toFormWaypoint(waypoints[0] || emptyWaypoint()));
      setSelectedWaypointId(waypoints[0]?.id || '');
    } catch (authError) {
      console.error('Admin sign-out failed:', authError);
      setError(t.adminSignOutFailed);
    } finally {
      setBusy(false);
    }
  };

  const handleChooseWaypoint = (waypointId) => {
    setIsCreating(false);
    setSelectedWaypointId(waypointId);
    setPhotoFile(null);
    setError('');
    setNotice('');
  };

  const updateDraft = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setNotice('');
  };

  const handleAddWaypoint = () => {
    onRequestMapPick();
  };

  const acceptPhoto = (file) => {
    if (!file) return;
    if (
      !ALLOWED_PHOTO_TYPES.includes(file.type) || file.size > MAX_PHOTO_SIZE
    ) {
      setError(t.adminPhotoRequirements);
      return;
    }

    setError('');
    setNotice('');
    setPhotoFile(file);
  };

  const handlePhotoChange = (event) => {
    acceptPhoto(event.target.files?.[0]);
    event.target.value = '';
  };

  const handlePhotoDrop = (event) => {
    event.preventDefault();
    setIsPhotoDragging(false);
    acceptPhoto(event.dataTransfer.files?.[0]);
  };
  const handleSaveWaypoint = async (event) => {
    event.preventDefault();

    const lat = Number(draft.lat);
    const lng = Number(draft.lng);
    const elevation = Number(draft.elevation);
    const slopeDeg = Number(draft.slopeDeg);
    if (
      !draft.name.trim() ||
      !draft.name_uz.trim() ||
      !Number.isFinite(lat) ||
      lat < -90 ||
      lat > 90 ||
      !Number.isFinite(lng) ||
      lng < 0 ||
      lng > 360 ||
      !Number.isFinite(elevation) ||
      !Number.isFinite(slopeDeg) ||
      slopeDeg < 0 ||
      slopeDeg > 90
    ) {
      setError(t.adminInvalidLocation);
      return;
    }

    setBusy(true);
    setError('');
    setNotice('');
    try {
      const waypointId = draft.id || `wp-${crypto.randomUUID()}`;
      let imageUrl = draft.img.trim();
      if (photoFile) {
        const signResponse = await fetch('/api/uploads/sign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentType: photoFile.type }),
        });
        const signedUpload = await signResponse.json();
        if (!signResponse.ok) {
          throw new Error(signedUpload.error || 'Photo upload failed.');
        }

        const uploadResponse = await fetch(signedUpload.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': photoFile.type },
          body: photoFile,
        });
        if (!uploadResponse.ok) {
          throw new Error('Photo upload failed.');
        }
        imageUrl = signedUpload.publicUrl;
      }

      const waypoint = {
        ...draft,
        id: waypointId,
        name: draft.name.trim(),
        name_uz: draft.name_uz.trim(),
        lat,
        lng,
        elevation,
        slopeDeg,
        hazard: draft.hazard.trim(),
        hazard_uz: draft.hazard_uz.trim(),
        mineralogy: draft.mineralogy.trim(),
        mineralogy_uz: draft.mineralogy_uz.trim(),
        scienceGoal: draft.scienceGoal.trim(),
        scienceGoal_uz: draft.scienceGoal_uz.trim(),
        notes: draft.notes.trim(),
        notes_uz: draft.notes_uz.trim(),
        sampleTarget: draft.sampleTarget.trim() || null,
        sampleTarget_uz: draft.sampleTarget_uz.trim() || null,
        img: imageUrl || null,
      };
      const updatedWaypoints = isCreating
        ? [...waypoints, waypoint]
        : waypoints.map((item) => item.id === waypointId ? waypoint : item);

      await onSave(zoneId, updatedWaypoints);
      setIsCreating(false);
      setSelectedWaypointId(waypointId);
      setDraft(toFormWaypoint(waypoint));
      setPhotoFile(null);
      setNotice(t.adminSaved);
    } catch (saveError) {
      console.error('Could not save the Mars map location:', saveError);
      setError(t.adminSaveFailed);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteWaypoint = async () => {
    if (isCreating || !selectedWaypointId) return;
    if (!window.confirm(t.adminConfirmDelete)) return;

    setBusy(true);
    setError('');
    setNotice('');
    try {
      const updatedWaypoints = waypoints.filter((waypoint) =>
        waypoint.id !== selectedWaypointId
      );
      await onSave(zoneId, updatedWaypoints);
      const nextWaypoint = updatedWaypoints[0];
      setSelectedWaypointId(nextWaypoint?.id || '');
      setDraft(toFormWaypoint(nextWaypoint || emptyWaypoint()));
      setNotice(t.adminDeleted);
    } catch (saveError) {
      console.error('Could not delete the Mars map location:', saveError);
      setError(t.adminSaveFailed);
    } finally {
      setBusy(false);
    }
  };

  const textFields = [
    ['name', t.adminNameEn],
    ['name_uz', t.adminNameUz],
    ['hazard', t.adminHazardEn],
    ['hazard_uz', t.adminHazardUz],
    ['mineralogy', t.adminMineralogyEn],
    ['mineralogy_uz', t.adminMineralogyUz],
    ['sampleTarget', t.adminSampleEn],
    ['sampleTarget_uz', t.adminSampleUz],
  ];
  const longTextFields = [
    ['scienceGoal', t.adminScienceEn],
    ['scienceGoal_uz', t.adminScienceUz],
    ['notes', t.adminNotesEn],
    ['notes_uz', t.adminNotesUz],
  ];
  const numericFields = [
    ['lat', t.adminLatitude, 'any'],
    ['lng', t.adminLongitude, 'any'],
    ['elevation', t.adminElevation, '1'],
    ['slopeDeg', t.adminSlope, 'any'],
  ];

  return (
    <div
      className='fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3'
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role='dialog'
        aria-modal='true'
        aria-labelledby='admin-panel-title'
        className='w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-2xl border border-cyan-500/40 bg-slate-950 text-slate-100 shadow-2xl'
      >
        <div className='sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-950 p-4'>
          <div className='flex items-center gap-2 min-w-0'>
            <MapPin className='h-5 w-5 shrink-0 text-cyan-400' />
            <div className='min-w-0'>
              <h2
                id='admin-panel-title'
                className='font-orbitron text-sm font-bold'
              >
                {t.adminTitle}
              </h2>
              <p className='truncate text-xs text-slate-400'>{zoneName}</p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            {isAdmin && (
              <button
                type='button'
                onClick={handleSignOut}
                disabled={busy}
                className='flex items-center gap-1 rounded-lg border border-slate-700 px-2 py-1.5 text-xs text-slate-300 hover:text-white disabled:opacity-50'
              >
                <LogOut className='h-3.5 w-3.5' />
                {t.adminSignOut}
              </button>
            )}
            <button
              type='button'
              onClick={onClose}
              className='rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white'
              aria-label={t.closePanel}
            >
              <X className='h-4 w-4' />
            </button>
          </div>
        </div>

        {checkingAuth
          ? (
            <p className='p-6 text-center text-sm text-slate-400'>
              {t.adminChecking}
            </p>
          )
          : !isAdmin
          ? (
            <form
              onSubmit={handleSignIn}
              className='mx-auto max-w-md space-y-4 p-6'
            >
              <h3 className='font-orbitron text-base font-bold'>
                {t.adminLoginTitle}
              </h3>
              <label className='block space-y-1 text-xs text-slate-300'>
                <span>{t.adminUsername}</span>
                <input
                  type='text'
                  autoComplete='username'
                  required
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className='w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500'
                />
              </label>
              <label className='block space-y-1 text-xs text-slate-300'>
                <span>{t.adminPassword}</span>
                <input
                  type='password'
                  autoComplete='current-password'
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className='w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500'
                />
              </label>
              {error && (
                <p role='alert' className='text-sm text-red-300'>{error}</p>
              )}
              <button
                type='submit'
                disabled={busy}
                className='flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-500 disabled:opacity-50'
              >
                <LogIn className='h-4 w-4' />
                {busy ? t.adminSigningIn : t.adminSignIn}
              </button>
            </form>
          )
          : (
            <div className='space-y-4 p-4'>
              <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
                {[
                  {
                    label: t.adminStatLocations,
                    value: waypoints.length,
                    color: 'text-cyan-300',
                  },
                  {
                    label: t.adminStatPhotos,
                    value: photoCount,
                    color: 'text-fuchsia-300',
                  },
                  {
                    label: t.adminStatCategories,
                    value: typeCount,
                    color: 'text-amber-300',
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className='rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-3'
                  >
                    <p className='text-[10px] font-mono uppercase tracking-wider text-slate-500'>
                      {stat.label}
                    </p>
                    <p
                      className={`mt-1 font-orbitron text-xl font-bold ${stat.color}`}
                    >
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className='flex flex-wrap items-center justify-between gap-3'>
                <div>
                  <h3 className='font-orbitron text-sm font-bold'>
                    {t.adminLocationsTitle}
                  </h3>
                  <p className='mt-1 text-[11px] text-slate-500'>{zoneName}</p>
                </div>
                <div className='flex flex-wrap items-center gap-2'>
                  <div
                    role='status'
                    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[11px] ${
                      isDirty
                        ? 'border-amber-700/50 bg-amber-950/30 text-amber-300'
                        : 'border-emerald-800/60 bg-emerald-950/30 text-emerald-300'
                    }`}
                  >
                    {isDirty
                      ? <Clock3 className='h-3.5 w-3.5' />
                      : <Check className='h-3.5 w-3.5' />}
                    {isDirty ? t.adminUnsavedChanges : t.adminAllChangesSaved}
                  </div>
                  <button
                    type='button'
                    onClick={handleAddWaypoint}
                    disabled={busy}
                    className='rounded-lg border border-cyan-700 bg-cyan-950/40 px-3 py-2 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-900/60 disabled:opacity-50'
                  >
                    {t.adminAddLocation}
                  </button>
                </div>
              </div>

              <div className='grid grid-cols-1 gap-4 lg:grid-cols-[270px_minmax(0,1fr)]'>
                <aside className='flex min-h-0 flex-col rounded-xl border border-slate-800 bg-slate-900/50 p-3'>
                  <div className='mb-3 flex items-center justify-between'>
                    <h4 className='text-xs font-bold text-slate-200'>
                      {t.adminLocationsTitle}
                    </h4>
                    <span className='rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400'>
                      {filteredWaypoints.length}/{waypoints.length}
                    </span>
                  </div>
                  <div className='mb-3 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-1'>
                    <label className='relative block'>
                      <Search className='pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500' />
                      <input
                        type='search'
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder={t.adminSearchLocation}
                        aria-label={t.adminSearchLocation}
                        className='w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-8 pr-3 text-xs text-white outline-none placeholder:text-slate-600 focus:border-cyan-600'
                      />
                    </label>
                    <select
                      value={typeFilter}
                      onChange={(event) => setTypeFilter(event.target.value)}
                      aria-label={t.adminType}
                      className='rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs text-white outline-none focus:border-cyan-600'
                    >
                      <option value='all'>{t.adminFilterAllTypes}</option>
                      {[
                        ...new Set(
                          waypoints.map((waypoint) => waypoint.type).filter(
                            Boolean,
                          ),
                        ),
                      ]
                        .sort()
                        .map((type) => (
                          <option key={type} value={type}>
                            {typeLabels[type] || type}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className='min-h-24 space-y-1.5 overflow-y-auto lg:max-h-[calc(92vh-22rem)]'>
                    {filteredWaypoints.map((waypoint) => {
                      const isSelected = !isCreating &&
                        waypoint.id === selectedWaypointId;
                      const displayName = lang === 'uz'
                        ? (waypoint.name_uz || waypoint.name)
                        : waypoint.name;
                      return (
                        <button
                          key={waypoint.id}
                          type='button'
                          onClick={() => handleChooseWaypoint(waypoint.id)}
                          disabled={busy}
                          className={`flex w-full items-center gap-2.5 rounded-lg border p-2 text-left transition disabled:opacity-50 ${
                            isSelected
                              ? 'border-cyan-500/50 bg-cyan-950/40'
                              : 'border-transparent hover:border-slate-700 hover:bg-slate-800/70'
                          }`}
                        >
                          {waypoint.img
                            ? (
                              <img
                                src={waypoint.img}
                                alt=''
                                loading='lazy'
                                className='h-11 w-11 shrink-0 rounded-md border border-slate-700 object-cover'
                              />
                            )
                            : (
                              <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-slate-700 bg-slate-950 text-slate-500'>
                                <MapPin className='h-4 w-4' />
                              </span>
                            )}
                          <span className='min-w-0 flex-1'>
                            <span className='block truncate text-xs font-semibold text-slate-100'>
                              {displayName}
                            </span>
                            <span className='mt-1 block truncate text-[10px] text-slate-500'>
                              {typeLabels[waypoint.type] || waypoint.type} ·
                              {' '}
                              {waypoint.lat}, {waypoint.lng}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                    {filteredWaypoints.length === 0 && (
                      <p className='px-2 py-6 text-center text-xs text-slate-500'>
                        {t.adminNoSearchResults}
                      </p>
                    )}
                  </div>
                </aside>

                <div className='min-w-0 rounded-xl border border-slate-800 bg-slate-900/30 p-3 sm:p-4'>
                  <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
                    <h4 className='font-orbitron text-xs font-bold text-white'>
                      {isCreating ? t.adminNewLocation : t.adminEditLocation}
                    </h4>
                    <button
                      type='button'
                      onClick={handleDeleteWaypoint}
                      disabled={busy || isCreating || !selectedWaypointId}
                      className='flex items-center gap-1 rounded-lg border border-red-900/70 px-2.5 py-1.5 text-[11px] text-red-300 transition hover:bg-red-950/50 disabled:opacity-40'
                    >
                      <Trash2 className='h-3.5 w-3.5' />
                      {t.adminDeleteLocation}
                    </button>
                  </div>

                  <form
                    onSubmit={handleSaveWaypoint}
                    className='grid grid-cols-1 gap-3 md:grid-cols-2'
                  >
                    {numericFields.map(([key, label, step]) => (
                      <label
                        key={key}
                        className='space-y-1 text-xs text-slate-300'
                      >
                        <span>{label}</span>
                        <input
                          type='number'
                          step={step}
                          required
                          value={draft[key]}
                          onChange={(event) =>
                            updateDraft(key, event.target.value)}
                          className='w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500'
                        />
                      </label>
                    ))}

                    <label className='space-y-1 text-xs text-slate-300'>
                      <span>{t.adminType}</span>
                      <select
                        value={draft.type}
                        onChange={(event) =>
                          updateDraft('type', event.target.value)}
                        className='w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500'
                      >
                        {Object.entries(typeLabels).map(([type, label]) => (
                          <option key={type} value={type}>{label}</option>
                        ))}
                      </select>
                    </label>

                    {textFields.map(([key, label]) => (
                      <label
                        key={key}
                        className='space-y-1 text-xs text-slate-300'
                      >
                        <span>{label}</span>
                        <input
                          type='text'
                          required={key === 'name' || key === 'name_uz'}
                          value={draft[key]}
                          onChange={(event) =>
                            updateDraft(key, event.target.value)}
                          className='w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500'
                        />
                      </label>
                    ))}

                    {longTextFields.map(([key, label]) => (
                      <label
                        key={key}
                        className='space-y-1 text-xs text-slate-300'
                      >
                        <span>{label}</span>
                        <textarea
                          rows='3'
                          value={draft[key]}
                          onChange={(event) =>
                            updateDraft(key, event.target.value)}
                          className='w-full resize-y rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500'
                        />
                      </label>
                    ))}

                    <label className='space-y-1 text-xs text-slate-300 md:col-span-2'>
                      <span>{t.adminPhotoUrl}</span>
                      <input
                        type='url'
                        value={draft.img}
                        onChange={(event) =>
                          updateDraft('img', event.target.value)}
                        className='w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500'
                      />
                    </label>
                    <label
                      htmlFor='admin-photo-file'
                      onDragOver={(event) => {
                        event.preventDefault();
                        setIsPhotoDragging(true);
                      }}
                      onDragLeave={() => setIsPhotoDragging(false)}
                      onDrop={handlePhotoDrop}
                      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-5 text-center text-xs transition md:col-span-2 ${
                        isPhotoDragging
                          ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200'
                          : 'border-slate-700 bg-slate-950/50 text-slate-300 hover:border-cyan-600'
                      }`}
                    >
                      <ImagePlus className='h-5 w-5 text-cyan-400' />
                      <span className='font-semibold'>
                        {photoFile?.name || t.adminDropPhoto}
                      </span>
                      <span className='text-cyan-300 underline underline-offset-2'>
                        {t.adminBrowsePhotos}
                      </span>
                      <span className='text-[10px] text-slate-500'>
                        {t.adminUploadPhoto}
                      </span>
                      <input
                        id='admin-photo-file'
                        type='file'
                        accept='image/jpeg,image/png,image/webp'
                        onChange={handlePhotoChange}
                        className='sr-only'
                      />
                    </label>
                    {(photoPreviewUrl || draft.img) && (
                      <img
                        src={photoPreviewUrl || draft.img}
                        alt={t.adminPhotoPreview}
                        className='max-h-48 w-fit max-w-full rounded-lg border border-slate-700 object-contain md:col-span-2'
                      />
                    )}

                    <div className='space-y-2 md:col-span-2'>
                      {error && (
                        <p role='alert' className='text-sm text-red-300'>
                          {error}
                        </p>
                      )}
                      {notice && (
                        <p role='status' className='text-sm text-emerald-300'>
                          {notice}
                        </p>
                      )}
                      <button
                        type='submit'
                        disabled={busy || !isDirty}
                        className='flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50'
                      >
                        <Save className='h-4 w-4' />
                        {busy ? t.adminSaving : t.adminSaveLocation}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
      </section>
    </div>
  );
}
