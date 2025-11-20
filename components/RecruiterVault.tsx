
import React from 'react';
import { Recruiter } from '../types';

interface RecruiterVaultProps {
  contacts: Recruiter[];
}

const formatRelativeTime = (isoDate: string) => {
    const date = new Date(isoDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

const RecruiterVault: React.FC<RecruiterVaultProps> = ({ contacts }) => {
  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
      <div className="p-6 border-b border-slate-700 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Recruiter Vault
        </h2>
        <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-md">{contacts.length} Contacts</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="bg-slate-900 text-slate-200 uppercase font-medium text-xs">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Company</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Last Contact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {contacts.length === 0 ? (
               <tr>
                 <td colSpan={5} className="px-6 py-8 text-center italic text-slate-500">
                   No contacts found yet. Scan your emails to populate.
                 </td>
               </tr>
            ) : (
              contacts.map((contact, idx) => (
                <tr key={idx} className="hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{contact.name}</td>
                  <td className="px-6 py-4 text-blue-300">{contact.company}</td>
                  <td className="px-6 py-4">{contact.role}</td>
                  <td className="px-6 py-4">
                    <a href={`mailto:${contact.email}`} className="text-emerald-400 hover:underline">
                      {contact.email}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(contact.lastContactDate).toLocaleDateString()} 
                    <span className="ml-2 text-xs text-slate-600">({formatRelativeTime(contact.lastContactDate)})</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecruiterVault;
