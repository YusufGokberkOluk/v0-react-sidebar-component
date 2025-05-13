"use client"

import { useState, useEffect } from "react"

export default function AccountSettings() {
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [darkMode, setDarkMode] = useState(true)
  const [autoSave, setAutoSave] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [reminderNotifications, setReminderNotifications] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [originalName, setOriginalName] = useState("")
  const [originalEmail, setOriginalEmail] = useState("")

  // Kullanıcı bilgilerini API'den yükle
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/user")
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user) {
            // API'den gelen kullanıcı bilgilerini state'e ayarla
            setName(data.user.name || "")
            setEmail(data.user.email || "")

            // Eğer isim yoksa ve email varsa, email'den kullanıcı adı oluştur
            if (!data.user.name && data.user.email) {
              const username = data.user.email.split("@")[0]
              setName(username.charAt(0).toUpperCase() + username.slice(1))
            }
          }
        } else {
          console.error("Kullanıcı bilgileri alınamadı")
        }
      } catch (error) {
        console.error("Kullanıcı bilgileri yüklenirken hata:", error)
      }
    }

    fetchUserData()
  }, [])

  // Orijinal değerleri yükle
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/user")
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user) {
            setOriginalName(data.user.name || "")
            setOriginalEmail(data.user.email || "")
          }
        }
      } catch (error) {
        console.error("Orijinal kullanıcı bilgileri yüklenirken hata:", error)
      }
    }

    fetchUserData()
  }, [])

  // Değişiklikleri izle
  useEffect(() => {
    if (name !== originalName || email !== originalEmail) {
      setHasUnsavedChanges(true)
    } else {
      setHasUnsavedChanges(false)
    }
  }, [name, email, originalName, originalEmail])

  const handleDeleteRequest = () => {
    console.log("Request delete account confirmation")
    setShowConfirmation(true)
  }

  const handleCancelDelete = () => {
    setShowConfirmation(false)
  }

  const handleConfirmDelete = async () => {
    console.log("Account deletion confirmed")
    setShowConfirmation(false)

    try {
      // API'ye DELETE isteği gönder
      const response = await fetch("/api/user", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Başarılı olduğunda localStorage'ı temizle
        localStorage.removeItem("isLoggedIn")
        localStorage.removeItem("userEmail")
        localStorage.removeItem("userName")

        // Kullanıcıya bilgi ver ve ana sayfaya yönlendir
        alert("Hesabınız başarıyla silindi.")
        window.location.href = "/"
      } else {
        alert("Hesap silinirken bir hata oluştu: " + (data.message || "Bilinmeyen hata"))
      }
    } catch (error) {
      console.error("Hesap silme hatası:", error)
      alert("Hesabınız silinirken bir hata oluştu. Lütfen tekrar deneyin.")
    }
  }

  const handleSaveChanges = async () => {
    try {
      // Değişiklikleri API'ye gönder
      const response = await fetch("/api/user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          // Email değişikliği için ayrı bir endpoint kullanılabilir
          // Bu örnekte email değişikliği yapmıyoruz
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Başarılı olduğunda orijinal değerleri güncelle
        setOriginalName(name)
        setHasUnsavedChanges(false)
        alert("Profil bilgileriniz başarıyla güncellendi!")
      } else {
        alert("Profil bilgileriniz güncellenirken bir hata oluştu: " + (data.message || "Bilinmeyen hata"))
      }
    } catch (error) {
      console.error("Profil güncelleme hatası:", error)
      alert("Profil bilgileriniz güncellenirken bir hata oluştu. Lütfen tekrar deneyin.")
    }
  }

  return (
    <div className="min-h-screen bg-[#EDF4ED] text-[#13262F] p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

        {/* Profile Information */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-[#ABD1B5] rounded-md focus:outline-none focus:ring-2 focus:ring-[#79B791]"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-[#ABD1B5] rounded-md focus:outline-none focus:ring-2 focus:ring-[#79B791]"
              />
            </div>
            {hasUnsavedChanges && (
              <div className="flex justify-end">
                <button
                  onClick={handleSaveChanges}
                  className="px-4 py-2 bg-[#79B791] text-white font-medium rounded-md hover:bg-[#ABD1B5] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#79B791] focus:ring-offset-2"
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Account Preferences */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Account Preferences</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="darkMode"
                checked={darkMode}
                onChange={() => setDarkMode(!darkMode)}
                className="h-4 w-4 text-[#79B791] border-[#ABD1B5] rounded focus:ring-[#79B791]"
              />
              <label htmlFor="darkMode" className="ml-2 block text-sm">
                Enable Dark Mode
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoSave"
                checked={autoSave}
                onChange={() => setAutoSave(!autoSave)}
                className="h-4 w-4 text-[#79B791] border-[#ABD1B5] rounded focus:ring-[#79B791]"
              />
              <label htmlFor="autoSave" className="ml-2 block text-sm">
                Auto-save notes while typing
              </label>
            </div>
          </div>
        </section>

        {/* Notification Settings */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="emailNotifications"
                checked={emailNotifications}
                onChange={() => setEmailNotifications(!emailNotifications)}
                className="h-4 w-4 text-[#79B791] border-[#ABD1B5] rounded focus:ring-[#79B791]"
              />
              <label htmlFor="emailNotifications" className="ml-2 block text-sm">
                Email Notifications
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="reminderNotifications"
                checked={reminderNotifications}
                onChange={() => setReminderNotifications(!reminderNotifications)}
                className="h-4 w-4 text-[#79B791] border-[#ABD1B5] rounded focus:ring-[#79B791]"
              />
              <label htmlFor="reminderNotifications" className="ml-2 block text-sm">
                Reminder Notifications
              </label>
            </div>
          </div>
        </section>

        {/* Delete Account */}
        <section className="border-2 border-red-300 bg-red-50 rounded-lg p-6 mt-12">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Delete Account</h2>
          <p className="mb-4 text-[#13262F]/80">
            Deleting your account is permanent and cannot be undone. All your data, including notes, settings, and
            personal information will be permanently removed from our systems.
          </p>
          <p className="mb-6 text-[#13262F]/80">
            Before proceeding, we recommend downloading any important data or notes you wish to keep.
          </p>
          <button
            onClick={handleDeleteRequest}
            className="px-4 py-2 bg-white border-2 border-red-500 text-red-600 font-medium rounded-md hover:bg-red-500 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Delete My Account Permanently
          </button>
        </section>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-red-600 mb-4">Confirm Account Deletion</h3>
            <p className="mb-6">
              Are you absolutely sure you want to delete your account? This action cannot be undone and all your data
              will be permanently lost.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
              >
                Yes, Delete My Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
