'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, Shield, Download, Trash2, Info } from 'lucide-react'

interface ToggleProps { label: string; description: string; defaultChecked?: boolean }
function Toggle({ label, description, defaultChecked = false }: ToggleProps) {
  const [checked, setChecked] = useState(defaultChecked)
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-[#252525]">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
      <button onClick={() => setChecked(!checked)} className={`relative w-10 h-6 rounded-full transition-colors duration-150 ${checked ? 'bg-[#A99B8C]' : 'bg-gray-200'}`}>
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-150 ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 md:p-8 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#252525]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your app preferences</p>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-[#A99B8C]" />
          <h2 className="text-lg font-semibold text-[#252525]">Notifications</h2>
        </div>
        <Toggle label="Outfit Reminders" description="Get daily reminders to log your outfit" defaultChecked />
        <Toggle label="Style Tips" description="Weekly style tips based on your wardrobe" defaultChecked />
        <Toggle label="New Feature Updates" description="Be notified of new ClosetAI features" />
        <Toggle label="Wear Streak Alerts" description="Alerts when you go too long without logging" />
      </div>

      {/* Privacy */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-[#A99B8C]" />
          <h2 className="text-lg font-semibold text-[#252525]">Privacy</h2>
        </div>
        <Toggle label="Improve AI with my data" description="Allow ClosetAI to use your wardrobe data to improve recommendations" defaultChecked />
        <Toggle label="Share analytics" description="Help us improve by sharing anonymised usage analytics" />
        <div className="mt-3 p-3 bg-[#F8F6F2] rounded-lg">
          <p className="text-xs text-gray-500">Your wardrobe images and personal data are stored securely and never shared with third parties. See our <span className="underline cursor-pointer">Privacy Policy</span> for details.</p>
        </div>
      </div>

      {/* Data */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Download className="w-4 h-4 text-[#A99B8C]" />
          <h2 className="text-lg font-semibold text-[#252525]">Data</h2>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-[#252525]">Export Wardrobe Data</p>
            <p className="text-xs text-gray-400 mb-2">Download a copy of all your wardrobe items and outfits as JSON</p>
            <button className="px-4 py-2 border border-[#A99B8C] text-[#A99B8C] rounded-lg text-sm hover:bg-[#A99B8C] hover:text-white transition-colors">
              Export Data
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-red-100">
        <div className="flex items-center gap-2 mb-4">
          <Trash2 className="w-4 h-4 text-red-500" />
          <h2 className="text-lg font-semibold text-red-600">Danger Zone</h2>
        </div>
        <div>
          <p className="text-sm font-medium text-[#252525]">Delete Account</p>
          <p className="text-xs text-gray-400 mb-3">Permanently delete your account and all wardrobe data. This cannot be undone.</p>
          <button onClick={() => setShowDeleteDialog(true)} className="px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-100 transition-colors">
            Delete My Account
          </button>
        </div>
      </div>

      {/* App Info */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-4 h-4 text-[#A99B8C]" />
          <h2 className="text-lg font-semibold text-[#252525]">About</h2>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-sm"><span className="text-gray-500">App Version</span><span className="text-[#252525] font-medium">1.0.0</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Build</span><span className="text-[#252525] font-medium">2024.11</span></div>
        </div>
      </div>

      {/* Delete Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold text-[#252525] mb-2">Delete Account?</h3>
            <p className="text-sm text-gray-500 mb-4">This will permanently delete your account, wardrobe, and all data. Type <strong>DELETE</strong> to confirm.</p>
            <input type="text" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-red-300" placeholder="Type DELETE" />
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteDialog(false); setDeleteConfirm('') }}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors">Cancel</button>
              <button disabled={deleteConfirm !== 'DELETE'}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                Delete Forever
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
