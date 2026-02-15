import { memo, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
    FaBell,
    FaBox,
    FaCamera,
    FaEye,
    FaKey,
    FaPalette,
    FaSync,
    FaUser,
} from "react-icons/fa";
import defaultAvatar from "../assets/default.jpeg";
import SuccessModal from "../components/inventory/SuccessModal";
import Header from "../components/shared/header";
import { useAuth } from "../context/AuthContext";
import { SidebarContext } from "../context/SidebarContext";
import { useTheme } from "../context/ThemeContext";

const Settings = () => {
  const { isExpanded } = useContext(SidebarContext);
  const { isOwner, currentUser, login } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("personal");
  const [currentPin, setCurrentPin] = useState(["", "", "", "", "", ""]);
  const [newPin, setNewPin] = useState(["", "", "", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(["", "", "", "", "", ""]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [dateJoined, setDateJoined] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [permissions, setPermissions] = useState({
    posTerminal: false,
    viewTransactions: false,
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [archives, setArchives] = useState([]);
  const [archivesLoading, setArchivesLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (currentUser) {
      const fallbackFirst =
        currentUser.firstName || currentUser.name?.split(" ")[0] || "";
      const fallbackLast =
        currentUser.lastName ||
        currentUser.name?.split(" ").slice(1).join(" ") ||
        "";

      setFirstName(fallbackFirst);
      setLastName(fallbackLast);
      setEmail(currentUser.email || "");
      setContactNumber(currentUser.contactNo || "");
      setRole(currentUser.role || "");
      setStatus(currentUser.status || "Active");
      setProfileImage(
        currentUser.image || currentUser.profileImage || defaultAvatar,
      );
      setPermissions(
        currentUser.permissions || {
          posTerminal: false,
          viewTransactions: false,
        },
      );

      if (currentUser.dateJoinedActual || currentUser.dateJoined) {
        const date = new Date(
          currentUser.dateJoinedActual || currentUser.dateJoined,
        );
        setDateJoined(
          date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "2-digit",
          }),
        );
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (activeTab === "archives") {
      fetchArchives();
    }
  }, [activeTab]);

  const fetchArchives = async () => {
    setArchivesLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/archive");
      const data = await response.json();

      if (data.success) {
        setArchives(data.data || []);
      } else {
        setArchives([]);
      }
    } catch (error) {
      console.error("Error fetching archives:", error);
      setArchives([]);
    } finally {
      setArchivesLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handlePinInput = (value, index, type) => {
    if (value && !/^\d$/.test(value)) return;

    const updatedPin = [
      ...(type === "current"
        ? currentPin
        : type === "new"
          ? newPin
          : confirmPin),
    ];
    updatedPin[index] = value;

    if (type === "current") {
      setCurrentPin(updatedPin);
    } else if (type === "new") {
      setNewPin(updatedPin);
    } else {
      setConfirmPin(updatedPin);
    }

    if (value && index < 5) {
      const nextInput = document.getElementById(`${type}-pin-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be smaller than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const newImageData = reader.result;
      setProfileImage(newImageData);
      setError("");
      handleAutoSaveProfileImage(newImageData);
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async (overrides = {}) => {
    if (!currentUser?._id && !currentUser?.id) {
      setError("User not found");
      return;
    }

    const mergedProfile = {
      firstName: overrides.firstName ?? firstName,
      lastName: overrides.lastName ?? lastName,
      email: overrides.email ?? email,
      contactNumber: overrides.contactNumber ?? contactNumber,
      profileImage: overrides.profileImage ?? profileImage,
      image: overrides.image ?? overrides.profileImage ?? profileImage,
    };

    if (!mergedProfile.firstName?.trim() || !mergedProfile.lastName?.trim()) {
      setError("First name and last name are required");
      return;
    }

    if (!mergedProfile.email?.trim()) {
      setError("Email is required");
      return;
    }

    setProfileLoading(true);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:5000/api/employees/${currentUser._id || currentUser.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: mergedProfile.firstName.trim(),
            lastName: mergedProfile.lastName.trim(),
            name: `${mergedProfile.firstName} ${mergedProfile.lastName}`.trim(),
            email: mergedProfile.email.trim().toLowerCase(),
            contactNo: mergedProfile.contactNumber.trim(),
            profileImage: mergedProfile.profileImage,
            image: mergedProfile.image,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        setSuccessMessage("Profile updated successfully!");
        setShowSuccessModal(true);
        const apiUser = data.data || {};
        const finalProfileImage =
          apiUser.profileImage || apiUser.image || mergedProfile.profileImage;

        const updatedUser = {
          ...currentUser,
          ...apiUser,
          firstName: apiUser.firstName ?? mergedProfile.firstName.trim(),
          lastName: apiUser.lastName ?? mergedProfile.lastName.trim(),
          name:
            apiUser.name ??
            `${mergedProfile.firstName} ${mergedProfile.lastName}`.trim(),
          email: apiUser.email ?? mergedProfile.email.trim().toLowerCase(),
          contactNo: apiUser.contactNo ?? mergedProfile.contactNumber.trim(),
          profileImage: finalProfileImage,
          image: finalProfileImage,
        };
        login(updatedUser);
      } else {
        setError(data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to update profile. Please try again.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleAutoSaveProfileImage = async (imageData) => {
    await saveProfile({ profileImage: imageData, image: imageData });
  };

  const handleUpdatePin = async () => {
    const currentPinValue = currentPin.join("");
    const newPinValue = newPin.join("");
    const confirmPinValue = confirmPin.join("");

    if (currentPinValue.length !== 6) {
      setError("Please enter your current 6-digit PIN");
      return;
    }

    if (newPinValue.length !== 6) {
      setError("New PIN must be 6 digits");
      return;
    }

    if (newPinValue !== confirmPinValue) {
      setError("New PIN and Confirm PIN do not match!");
      return;
    }

    if (!currentUser?._id && !currentUser?.id) {
      setError("User not found");
      return;
    }

    setPinLoading(true);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:5000/api/employees/${currentUser._id || currentUser.id}/pin`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentPin: currentPinValue,
            newPin: newPinValue,
            requiresPinReset: false,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        setSuccessMessage("PIN updated successfully!");
        setShowSuccessModal(true);
        setCurrentPin(["", "", "", "", "", ""]);
        setNewPin(["", "", "", "", "", ""]);
        setConfirmPin(["", "", "", "", "", ""]);
        if (data.data) {
          login({ ...currentUser, ...data.data });
        }
      } else {
        setError(data.message || "Failed to update PIN");
      }
    } catch (error) {
      console.error("Error updating PIN:", error);
      setError("Failed to update PIN. Please try again.");
    } finally {
      setPinLoading(false);
    }
  };

  const handleSyncData = async () => {
    setSyncLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/sync/all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();

      if (data.success) {
        setSuccessMessage(data.message || "Data synchronized successfully!");
        setShowSuccessModal(true);
      } else {
        setSuccessMessage("");
        alert(data.message || "Sync failed. Please try again.");
      }
    } catch (error) {
      console.error("Sync error:", error);
      alert(
        "Sync failed. Make sure you are connected to the internet and the server is running.",
      );
    } finally {
      setSyncLoading(false);
    }
  };

  const computedName = useMemo(() => {
    return (
      [firstName, lastName].filter(Boolean).join(" ") || currentUser?.name || ""
    );
  }, [firstName, lastName, currentUser?.name]);

  return (
    <div
      className={`p-8 min-h-screen ${theme === "dark" ? "bg-[#1E1B18]" : "bg-gray-50"}`}
    >
      <Header pageName="Account Settings" showBorder={false} />

      {isOwner() && (
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setActiveTab("personal")}
            className={`px-6 py-3 font-bold rounded-xl transition-all shadow-md ${
              activeTab === "personal"
                ? `text-[#AD7F65] border-b-4 border-[#AD7F65] ${theme === "dark" ? "bg-[#2A2724]" : "bg-white"}`
                : `${theme === "dark" ? "bg-[#2A2724] text-gray-300 border border-gray-700" : "bg-white text-gray-800 border border-gray-200"}`
            }`}
          >
            Personal Information
          </button>
          <button
            onClick={() => setActiveTab("archives")}
            className={`px-6 py-3 font-bold rounded-xl transition-all shadow-md ${
              activeTab === "archives"
                ? `text-[#AD7F65] border-b-4 border-[#AD7F65] ${theme === "dark" ? "bg-[#2A2724]" : "bg-white"}`
                : `${theme === "dark" ? "bg-[#2A2724] text-gray-300 border border-gray-700" : "bg-white text-gray-800 border border-gray-200"}`
            }`}
          >
            Archives
          </button>
        </div>
      )}

      {activeTab === "archives" ? (
        <div
          className={`rounded-2xl shadow-lg overflow-hidden ${theme === "dark" ? "bg-[#2A2724]" : "bg-white"}`}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead
                className={theme === "dark" ? "bg-[#1E1B18]" : "bg-gray-50"}
              >
                <tr>
                  <th
                    className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Archive Number
                  </th>
                  <th
                    className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Item Image
                  </th>
                  <th
                    className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                  >
                    SKU
                  </th>
                  <th
                    className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Item Name
                  </th>
                  <th
                    className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Category
                  </th>
                  <th
                    className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Quantity
                  </th>
                  <th
                    className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Price
                  </th>
                  <th
                    className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Reason
                  </th>
                  <th
                    className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Date & Time
                  </th>
                  <th
                    className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Archived By
                  </th>
                  <th
                    className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${theme === "dark" ? "bg-[#2A2724] divide-gray-700" : "bg-white divide-gray-200"}`}
              >
                {archivesLoading ? (
                  <tr>
                    <td
                      colSpan="11"
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B7355] mb-2"></div>
                        <span>Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : archives.length === 0 ? (
                  <tr>
                    <td
                      colSpan="11"
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-24 h-24 flex items-center justify-center mb-4">
                          <FaBox className="w-full h-full text-gray-300" />
                        </div>
                        <p className="text-gray-400 text-lg">No Archive yet</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  archives.map((archive, index) => {
                    const archiveNumber = archives.length - index;
                    return (
                      <tr
                        key={archive._id || archive.id}
                        className={`hover:${theme === "dark" ? "bg-[#1E1B18]" : "bg-gray-50"}`}
                      >
                        <td
                          className={`px-4 py-3 whitespace-nowrap text-sm font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                        >
                          #{archiveNumber}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {archive.itemImage ? (
                            <img
                              src={archive.itemImage}
                              alt={archive.itemName}
                              className="w-12 h-12 object-cover rounded"
                              onError={(e) => {
                                e.target.src = "https://via.placeholder.com/50";
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                              <span className="text-xs">No Image</span>
                            </div>
                          )}
                        </td>
                        <td
                          className={`px-4 py-3 whitespace-nowrap text-sm font-mono ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
                        >
                          {archive.sku}
                        </td>
                        <td
                          className={`px-4 py-3 whitespace-nowrap text-sm ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                        >
                          <div>
                            <div className="font-medium">
                              {archive.itemName}
                            </div>
                            {archive.variant && (
                              <div className="text-xs text-gray-500">
                                ({archive.variant})
                              </div>
                            )}
                            {archive.selectedSize && (
                              <div className="text-xs text-gray-500">
                                Size: {archive.selectedSize}
                              </div>
                            )}
                            {archive.brandName && (
                              <div className="text-xs text-gray-500">
                                Brand: {archive.brandName}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                            {archive.category}
                          </span>
                        </td>
                        <td
                          className={`px-4 py-3 whitespace-nowrap text-sm ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                        >
                          {archive.quantity}
                        </td>
                        <td
                          className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                        >
                          ₱{parseFloat(archive.itemPrice || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
                            {archive.reason}
                          </span>
                          {archive.returnReason && (
                            <div className="mt-1 text-xs text-gray-600">
                              {archive.returnReason}
                            </div>
                          )}
                          {archive.notes && (
                            <div className="mt-1 text-xs text-gray-500 italic">
                              {archive.notes}
                            </div>
                          )}
                        </td>
                        <td
                          className={`px-4 py-3 whitespace-nowrap text-sm ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                        >
                          {formatDateTime(archive.archivedAt)}
                        </td>
                        <td
                          className={`px-4 py-3 whitespace-nowrap text-sm ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                        >
                          {archive.archivedBy || "N/A"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            onClick={() =>
                              console.log("View archive:", archive)
                            }
                            className="text-green-600 hover:text-green-800"
                          >
                            <FaEye className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Information Card */}
          <div
            className={`rounded-3xl shadow-lg p-8 ${theme === "dark" ? "bg-[#2A2724]" : "bg-white"}`}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#AD7F65] flex items-center justify-center text-white">
                <FaUser className="w-5 h-5" />
              </div>
              <h3
                className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-800"}`}
              >
                Profile Information
              </h3>
            </div>

            <div className="flex items-start gap-8 mb-8">
              {/* Avatar */}
              <div
                className="relative group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg relative">
                  <img
                    src={profileImage}
                    alt={computedName}
                    className="w-full h-full object-cover transition-opacity group-hover:opacity-75"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                    <FaCamera className="text-white w-8 h-8" />
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>

              {/* Profile Summary */}
              <div className="flex-1">
                <h2
                  className={`text-2xl font-bold mb-1 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                >
                  {computedName}
                </h2>
                <p className="text-[#AD7F65] font-medium mb-3">{role}</p>

                <div className="mb-4">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                    Permissions:
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {role?.toLowerCase() === "owner" ? (
                      <span className="px-3 py-1 rounded-full text-xs font-medium border border-gray-200 text-gray-600 bg-gray-50">
                        Everything
                      </span>
                    ) : (
                      <>
                        {permissions.posTerminal && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium border border-gray-200 text-gray-600 bg-gray-50">
                            POS Terminal
                          </span>
                        )}
                        {permissions.viewTransactions && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium border border-gray-200 text-gray-600 bg-gray-50">
                            View Transactions
                          </span>
                        )}
                        {!permissions.posTerminal &&
                          !permissions.viewTransactions && (
                            <span className="text-xs text-gray-400 italic">
                              No active permissions
                            </span>
                          )}
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                    Status:
                  </label>
                  <span
                    className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${
                      status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {status}
                  </span>
                </div>
              </div>
            </div>

            {/* Personal Details */}
            <h4
              className={`text-base font-bold mb-4 ${theme === "dark" ? "text-white" : "text-gray-800"}`}
            >
              Personal Details
            </h4>
            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1 block">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={`w-full text-base font-semibold border-b-2 border-gray-200 focus:border-[#AD7F65] focus:outline-none py-1 bg-transparent ${
                    theme === "dark" ? "text-white" : "text-gray-800"
                  }`}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1 block">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={`w-full text-base font-semibold border-b-2 border-gray-200 focus:border-[#AD7F65] focus:outline-none py-1 bg-transparent ${
                    theme === "dark" ? "text-white" : "text-gray-800"
                  }`}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1 block">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full text-base font-semibold border-b-2 border-gray-200 focus:border-[#AD7F65] focus:outline-none py-1 bg-transparent ${
                    theme === "dark" ? "text-white" : "text-gray-800"
                  }`}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1 block">
                  Contact number
                </label>
                <input
                  type="text"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className={`w-full text-base font-semibold border-b-2 border-gray-200 focus:border-[#AD7F65] focus:outline-none py-1 bg-transparent ${
                    theme === "dark" ? "text-white" : "text-gray-800"
                  }`}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1 block">
                  Date Joined
                </label>
                <p
                  className={`text-base font-semibold py-1 ${theme === "dark" ? "text-white" : "text-gray-800"}`}
                >
                  {dateJoined || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1 block">
                  Position
                </label>
                <p
                  className={`text-base font-semibold py-1 ${theme === "dark" ? "text-white" : "text-gray-800"}`}
                >
                  Employee - {role}
                </p>
              </div>
            </div>
          </div>

          {/* Appearance Card */}
          <div
            className={`rounded-3xl shadow-lg p-8 ${theme === "dark" ? "bg-[#2A2724]" : "bg-white"}`}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#AD7F65] flex items-center justify-center text-white">
                <FaPalette className="w-5 h-5" />
              </div>
              <h3
                className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-800"}`}
              >
                Appearance
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <button
                onClick={() => setTheme("dark")}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                  theme === "dark"
                    ? "border-[#AD7F65] shadow-md"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="w-full h-16 rounded-xl bg-[#1E1B18] shadow-inner mb-2"></div>
                <span
                  className={`text-sm font-medium ${theme === "dark" ? "text-white" : "text-gray-700"}`}
                >
                  Dark Mode
                </span>
              </button>

              <button
                onClick={() => setTheme("light")}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                  theme === "light"
                    ? "border-[#AD7F65] shadow-md"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="w-full h-16 rounded-xl bg-white shadow-inner mb-2 border border-gray-100"></div>
                <span
                  className={`text-sm font-medium ${theme === "dark" ? "text-white" : "text-gray-700"}`}
                >
                  Light Mode
                </span>
              </button>
            </div>
          </div>

          {/* Notification Card */}
          <div
            className={`rounded-3xl shadow-lg p-8 ${theme === "dark" ? "bg-[#2A2724]" : "bg-white"}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#AD7F65] flex items-center justify-center text-white">
                  <FaBell className="w-5 h-5" />
                </div>
                <h3
                  className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-800"}`}
                >
                  Notification
                </h3>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={notificationsEnabled}
                  onChange={() =>
                    setNotificationsEnabled(!notificationsEnabled)
                  }
                />
                <div className="w-14 h-7 bg-gray-200 rounded-full peer peer-checked:bg-[#AD7F65] peer-focus:ring-2 peer-focus:ring-[#AD7F65]/20 transition-all"></div>
                <div className="absolute left-[3px] top-[3px] w-6 h-6 bg-white rounded-full transition-transform peer-checked:translate-x-7 shadow-sm"></div>
              </label>
            </div>
          </div>

          {/* Data Synchronization Card */}
          <div
            className={`rounded-3xl shadow-lg p-8 ${theme === "dark" ? "bg-[#2A2724]" : "bg-white"}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-[#AD7F65] flex items-center justify-center text-white">
                    <FaSync className="w-5 h-5" />
                  </div>
                  <h3
                    className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-800"}`}
                  >
                    Data Synchronization
                  </h3>
                </div>
                <p className="text-sm text-gray-500 ml-13">
                  Keep your data up to date across all devices. Manual sync
                  ensures changes are saved.
                </p>
              </div>

              <button
                onClick={handleSyncData}
                disabled={syncLoading}
                className="px-6 py-2.5 rounded-xl text-white font-bold bg-[#10B981] hover:bg-[#059669] transition-all shadow-md disabled:opacity-50 whitespace-nowrap"
              >
                {syncLoading ? "Syncing..." : "Sync Now"}
              </button>
            </div>
          </div>

          {/* Change PIN Card */}
          <div
            className={`rounded-3xl shadow-lg p-8 ${theme === "dark" ? "bg-[#2A2724]" : "bg-white"}`}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#AD7F65] flex items-center justify-center text-white">
                <FaKey className="w-5 h-5" />
              </div>
              <h3
                className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-800"}`}
              >
                Change PIN
              </h3>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-6 mb-6">
              {/* Current PIN */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
                >
                  Current PIN
                </label>
                <div className="flex gap-2">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <input
                      key={i}
                      id={`current-pin-${i}`}
                      type="password"
                      maxLength={1}
                      value={currentPin[i]}
                      onChange={(e) =>
                        handlePinInput(e.target.value, i, "current")
                      }
                      disabled={pinLoading}
                      className={`w-12 h-12 text-center text-lg font-bold rounded-xl border-2 shadow-sm focus:border-[#AD7F65] focus:shadow-md transition-all outline-none disabled:opacity-50 ${
                        theme === "dark"
                          ? "bg-[#1E1B18] border-gray-600 text-white focus:bg-[#352F2A]"
                          : "bg-gray-50 border-gray-200 text-gray-900 focus:bg-white"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* New PIN */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
                >
                  New PIN
                </label>
                <div className="flex gap-2">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <input
                      key={i}
                      id={`new-pin-${i}`}
                      type="password"
                      maxLength={1}
                      value={newPin[i]}
                      onChange={(e) => handlePinInput(e.target.value, i, "new")}
                      disabled={pinLoading}
                      className={`w-12 h-12 text-center text-lg font-bold rounded-xl border-2 shadow-sm focus:border-[#AD7F65] focus:shadow-md transition-all outline-none disabled:opacity-50 ${
                        theme === "dark"
                          ? "bg-[#1E1B18] border-gray-600 text-white focus:bg-[#352F2A]"
                          : "bg-gray-50 border-gray-200 text-gray-900 focus:bg-white"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Confirm PIN */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
                >
                  Confirm PIN
                </label>
                <div className="flex gap-2">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <input
                      key={i}
                      id={`confirm-pin-${i}`}
                      type="password"
                      maxLength={1}
                      value={confirmPin[i]}
                      onChange={(e) =>
                        handlePinInput(e.target.value, i, "confirm")
                      }
                      disabled={pinLoading}
                      className={`w-12 h-12 text-center text-lg font-bold rounded-xl border-2 shadow-sm focus:border-[#AD7F65] focus:shadow-md transition-all outline-none disabled:opacity-50 ${
                        theme === "dark"
                          ? "bg-[#1E1B18] border-gray-600 text-white focus:bg-[#352F2A]"
                          : "bg-gray-50 border-gray-200 text-gray-900 focus:bg-white"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleUpdatePin}
                disabled={pinLoading}
                className="px-8 py-2.5 rounded-xl text-white font-bold bg-[#3B82F6] hover:bg-[#2563EB] transition-all shadow-md disabled:opacity-50"
              >
                {pinLoading ? "Changing PIN..." : "Change PIN"}
              </button>
            </div>
          </div>
        </div>
      )}

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          setError("");
        }}
        message={successMessage}
      />
    </div>
  );
};

export default memo(Settings);
