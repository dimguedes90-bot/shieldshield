import React from 'react';
import { Profile } from '../../types';
import { PencilIcon } from '@heroicons/react/24/solid';

interface ManageProfilesProps {
    profiles: Profile[];
    onUpdateProfile: (profile: Profile) => void;
}

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; disabled: boolean }> = ({ checked, onChange, disabled }) => {
    return (
        <label className={`relative inline-flex items-center ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" disabled={disabled} />
            <div className={`w-11 h-6 bg-navy-light rounded-full peer peer-focus:ring-2 peer-focus:ring-teal after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${disabled ? 'opacity-50' : 'peer-checked:after:translate-x-full peer-checked:after:border-white peer-checked:bg-teal'}`}></div>
        </label>
    );
};

const ProfileCard: React.FC<{ profile: Profile; onUpdate: (updatedProfile: Profile) => void; isCustom: boolean }> = ({ profile, onUpdate, isCustom }) => {
    const handleToggle = (key: keyof Profile['toggles']) => {
        if (!isCustom) return;
        const updatedToggles = { ...profile.toggles, [key]: !profile.toggles[key] };
        onUpdate({ ...profile, toggles: updatedToggles });
    };

    const toggleLabels: Record<keyof Profile['toggles'], string> = {
        identity_number_token: 'Share Identity Token',
        professional_email: 'Share Professional Email',
        personal_email: 'Share Personal Email',
        professional_phone: 'Share Professional Phone',
        personal_phone: 'Share Personal Phone',
        linkedin_url: 'Share LinkedIn URL',
        age_over_18: 'Share Age Over 18',
    };

    return (
        <div className="bg-navy-dark p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-teal mb-4 flex items-center">
                {profile.name}
                {isCustom && <PencilIcon className="h-5 w-5 ml-2 text-gray-400" />}
            </h3>
            <div className="space-y-4">
                {Object.entries(profile.toggles).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center">
                        <span className="text-gray-300">{toggleLabels[key as keyof Profile['toggles']]}</span>
                        <ToggleSwitch checked={value} onChange={() => handleToggle(key as keyof Profile['toggles'])} disabled={!isCustom} />
                    </div>
                ))}
            </div>
        </div>
    );
};

const ManageProfiles: React.FC<ManageProfilesProps> = ({ profiles, onUpdateProfile }) => {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-teal">Manage Privacy Profiles</h2>
      <p className="mb-8 text-gray-400">Control exactly what information is shared when you issue a token. Only the 'Custom' profile is editable.</p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {profiles.map(profile => (
          <ProfileCard 
            key={profile.id} 
            profile={profile} 
            onUpdate={onUpdateProfile}
            isCustom={profile.id === 'custom'}
          />
        ))}
      </div>
    </div>
  );
};

export default ManageProfiles;
