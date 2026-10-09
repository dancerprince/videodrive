import { useState } from 'react';
import { parseExternalShareUrl, parseFolderUrl } from '../lib/workdriveFolder.js';

const isSupportedFolderUrl = (value) => !value.trim() || parseFolderUrl(value) || parseExternalShareUrl(value);

/** Modal for entering a WorkDrive public or external-share folder URL. */
const SettingsDialog = ({ initialUrl, onSave, onClose }) => {
    const [value, setValue] = useState(initialUrl);
    const invalid = !isSupportedFolderUrl(value);

    const submit = (event) => {
        event.preventDefault();
        if (invalid) return;
        onSave(value);
        onClose();
    };

    return (
        <div className='fixed inset-0 z-50 grid p-4 place-items-center bg-black/70' onClick={onClose}>
            <form
                role='dialog'
                aria-modal='true'
                aria-labelledby='settings-title'
                onSubmit={submit}
                onClick={(event) => event.stopPropagation()}
                className='w-full max-w-lg p-5 space-y-4 border rounded-xl bg-neutral-900 border-neutral-700'
            >
                <h2 id='settings-title' className='text-lg font-semibold'>Settings</h2>
                <label className='block space-y-2'>
                    <span className='text-sm text-neutral-300'>WorkDrive folder share URL</span>
                    <input
                        autoFocus
                        type='url'
                        value={value}
                        onChange={(event) => setValue(event.target.value)}
                        placeholder='https://workdrive.zohoexternal.in/external/share-token'
                        className='w-full px-3 py-2 text-sm text-white border rounded-md bg-neutral-950 border-neutral-700 focus:outline-none focus:border-white'
                    />
                </label>
                {invalid && <p className='text-xs text-red-400'>Enter a WorkDrive folder share link, such as https://workdrive.zohoexternal.in/external/&lt;token&gt;.</p>}
                <p className='text-xs text-neutral-500'>External share links are read on the server; their temporary guest credentials are not stored in your browser. Leave empty to use public/videos.json.</p>
                <div className='flex justify-end gap-2'>
                    <button type='button' onClick={onClose} className='px-4 py-2 text-sm rounded-md bg-neutral-800 hover:bg-neutral-700'>Cancel</button>
                    <button type='submit' disabled={invalid} className='px-4 py-2 text-sm font-semibold text-black bg-white rounded-md disabled:opacity-40'>Save</button>
                </div>
            </form>
        </div>
    );
};

export default SettingsDialog;
