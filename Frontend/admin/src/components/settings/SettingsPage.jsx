import React, { useEffect, useState } from "react";
import { KeyRound, Shield, UserPlus, UserMinus, Loader2, RefreshCcw } from "lucide-react";
import { useContextApi } from "../../hooks/useContextApi";

export default function SettingsPage() {
  const {
    changeAdminPassword,
    verifyAdminSecurityPassword,
    getAdminSecurityQuestions,
    updateAdminSecurityQuestions,
    requestAdminEmailChangeOldOtp,
    verifyAdminEmailChangeOldOtp,
    verifyAdminEmailChangeNewOtp,
    getMyProfile,
    getAdminUsers,
    createAdminUser,
    deleteAdminUser,
  } = useContextApi();
  const securityQuestionOptions = [
    "What was the name of your first school?",
    "What is your mother's maiden name?",
    "What was your childhood nickname?",
    "What is the name of your best friend from childhood?",
    "What was the make/model of your first vehicle?",
    "In which city were you born?",
    "What is your favorite teacher's name?",
    "What was your first job?",
    "What is your favorite movie?",
    "What is the name of your first pet?",
  ];

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [newAdminForm, setNewAdminForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [emailChangeForm, setEmailChangeForm] = useState({
    currentEmail: "",
    oldEmailOtp: "",
    newEmail: "",
    newEmailOtp: "",
  });
  const [securityQuestionsForm, setSecurityQuestionsForm] = useState([
    { question: "", answer: "" },
    { question: "", answer: "" },
    { question: "", answer: "" },
  ]);

  const [admins, setAdmins] = useState([]);
  const [currentAdminEmail, setCurrentAdminEmail] = useState("");
  const [primaryAdminEmail, setPrimaryAdminEmail] = useState("kuremedi370@gmail.com");
  const [isPrimaryAdmin, setIsPrimaryAdmin] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const [accessPassword, setAccessPassword] = useState("");
  const [accessError, setAccessError] = useState("");
  const [verifyingAccess, setVerifyingAccess] = useState(false);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [savingEmailChange, setSavingEmailChange] = useState("");
  const [loadingSecurityQuestions, setLoadingSecurityQuestions] = useState(false);
  const [savingSecurityQuestions, setSavingSecurityQuestions] = useState(false);
  const [removingAdminId, setRemovingAdminId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [devOtp, setDevOtp] = useState("");

  const loadAdmins = async () => {
    try {
      setLoadingAdmins(true);
      const data = await getAdminUsers();
      const adminList = Array.isArray(data?.admins) ? data.admins : [];
      const backendPrimaryEmail = String(data?.primaryAdminEmail || "").trim().toLowerCase();
      const knownPrimaryEmail = String(primaryAdminEmail || "").trim().toLowerCase();
      const currentEmail = String(currentAdminEmail || "").trim().toLowerCase();

      const filteredAdmins = adminList.filter((admin) => {
        const adminEmail = String(admin?.email || "").trim().toLowerCase();
        if (!adminEmail) return false;
        if (backendPrimaryEmail && adminEmail === backendPrimaryEmail) return false;
        if (knownPrimaryEmail && adminEmail === knownPrimaryEmail) return false;
        if (isPrimaryAdmin && currentEmail && adminEmail === currentEmail) return false;
        if (adminEmail === "kuremedi370@gmail.com") return false;
        return true;
      });
      setAdmins(filteredAdmins);
      if (data?.primaryAdminEmail) {
        setPrimaryAdminEmail(String(data.primaryAdminEmail));
      }
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || "Failed to load admins");
    } finally {
      setLoadingAdmins(false);
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await getMyProfile();
        const email = String(profile?.email || "").trim().toLowerCase();
        const primaryAdminEmail = String(profile?.primaryAdminEmail || "").trim().toLowerCase();
        const isPrimary =
          !!profile?.isPrimaryAdmin ||
          (!!primaryAdminEmail && email === primaryAdminEmail) ||
          email === "kuremedi370@gmail.com";
        setCurrentAdminEmail(email);
        setIsPrimaryAdmin(isPrimary);
        if (profile?.primaryAdminEmail) {
          setPrimaryAdminEmail(String(profile.primaryAdminEmail));
        }
        setEmailChangeForm((prev) => ({ ...prev, currentEmail: email }));
      } catch {
        setCurrentAdminEmail("");
        setIsPrimaryAdmin(false);
      }
    };

    loadProfile();
  }, []);

  const handleVerifyAccess = async (event) => {
    event.preventDefault();
    setAccessError("");

    try {
      setVerifyingAccess(true);
      const response = await verifyAdminSecurityPassword(accessPassword);
      setAccessGranted(true);
      setIsPrimaryAdmin(!!response?.isPrimaryAdmin);
      if (response?.primaryAdminEmail) {
        setPrimaryAdminEmail(String(response.primaryAdminEmail));
      }
      setAccessPassword("");
      await loadAdmins();
    } catch (error) {
      setAccessError(error?.response?.data?.message || "Password verification failed");
    } finally {
      setVerifyingAccess(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    try {
      setSavingPassword(true);
      const response = await changeAdminPassword(passwordForm);
      setSuccessMsg(response?.message || "Password changed successfully");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || "Failed to update password");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleAddAdmin = async (event) => {
    event.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    try {
      setSavingAdmin(true);
      const response = await createAdminUser(newAdminForm);
      setSuccessMsg(response?.message || "Admin added successfully");
      setNewAdminForm({ name: "", email: "", phone: "", password: "" });
      await loadAdmins();
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || "Failed to add admin");
    } finally {
      setSavingAdmin(false);
    }
  };

  const handleRequestOldEmailOtp = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      setSavingEmailChange("request-old");
      const response = await requestAdminEmailChangeOldOtp({
        currentEmail: emailChangeForm.currentEmail.trim(),
        newEmail: emailChangeForm.newEmail.trim(),
      });
      setSuccessMsg(response?.message || "OTP sent to current email");
      setDevOtp(response?.devOtp || "");
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || "Failed to send OTP to current email");
    } finally {
      setSavingEmailChange("");
    }
  };

  const handleVerifyOldEmailOtp = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      setSavingEmailChange("verify-old");
      const response = await verifyAdminEmailChangeOldOtp({
        currentEmail: emailChangeForm.currentEmail.trim(),
        newEmail: emailChangeForm.newEmail.trim(),
        otp: emailChangeForm.oldEmailOtp.trim(),
      });
      setSuccessMsg(response?.message || "Current email verified. OTP sent to new email.");
      setDevOtp(response?.devOtp || "");
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || "Failed to verify current email OTP");
    } finally {
      setSavingEmailChange("");
    }
  };

  const handleVerifyNewEmailOtp = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      setSavingEmailChange("verify-new");
      const response = await verifyAdminEmailChangeNewOtp({
        currentEmail: emailChangeForm.currentEmail.trim(),
        newEmail: emailChangeForm.newEmail.trim(),
        otp: emailChangeForm.newEmailOtp.trim(),
      });
      setSuccessMsg(response?.message || "Email changed successfully");
      setDevOtp("");
      setCurrentAdminEmail(emailChangeForm.newEmail.trim().toLowerCase());
      setPrimaryAdminEmail(emailChangeForm.newEmail.trim().toLowerCase());
      setEmailChangeForm({
        currentEmail: emailChangeForm.newEmail.trim().toLowerCase(),
        oldEmailOtp: "",
        newEmail: "",
        newEmailOtp: "",
      });
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || "Failed to change email");
    } finally {
      setSavingEmailChange("");
    }
  };

  const handleRemoveAdmin = async (adminId) => {
    if (!window.confirm("Remove this admin account?")) return;
    setErrorMsg("");
    setSuccessMsg("");

    try {
      setRemovingAdminId(adminId);
      const response = await deleteAdminUser(adminId);
      setSuccessMsg(response?.message || "Admin removed successfully");
      await loadAdmins();
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || "Failed to remove admin");
    } finally {
      setRemovingAdminId("");
    }
  };

  const loadSecurityQuestions = async () => {
    try {
      setLoadingSecurityQuestions(true);
      const response = await getAdminSecurityQuestions();
      const questions = Array.isArray(response?.questions) ? response.questions : [];
      setSecurityQuestionsForm((prev) =>
        prev.map((item, index) => ({
          question: questions[index] || "",
          answer: "",
        }))
      );
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || "Failed to load security questions");
    } finally {
      setLoadingSecurityQuestions(false);
    }
  };

  useEffect(() => {
    if (!accessGranted) return;
    loadSecurityQuestions();
  }, [accessGranted]);

  const handleSecurityQuestionChange = (index, field, value) => {
    setSecurityQuestionsForm((prev) =>
      prev.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSaveSecurityQuestions = async (event) => {
    event.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const selectedQuestions = securityQuestionsForm.map((item) => String(item.question || "").trim());
    const hasDuplicateQuestions = new Set(selectedQuestions.map((item) => item.toLowerCase())).size !== selectedQuestions.length;
    if (hasDuplicateQuestions) {
      setErrorMsg("Please select 3 different security questions");
      return;
    }

    try {
      setSavingSecurityQuestions(true);
      const payload = securityQuestionsForm.map((item) => ({
        question: String(item.question || "").trim(),
        answer: String(item.answer || "").trim(),
      }));
      const response = await updateAdminSecurityQuestions(payload);
      setSuccessMsg(response?.message || "Security questions updated successfully");
      setSecurityQuestionsForm((prev) => prev.map((item) => ({ ...item, answer: "" })));
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || "Failed to save security questions");
    } finally {
      setSavingSecurityQuestions(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {!accessGranted ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form onSubmit={handleVerifyAccess} className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">Admin Security Access</h2>
            <p className="mt-2 text-sm text-gray-600">Enter your password to open Admin Security.</p>
            <p className="mt-1 text-xs text-gray-500">Primary Admin Email: {primaryAdminEmail}</p>

            {accessError ? (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{accessError}</div>
            ) : null}

            <input
              type="password"
              value={accessPassword}
              onChange={(e) => setAccessPassword(e.target.value)}
              placeholder="Enter password"
              className="mt-4 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
              required
            />

            <button
              type="submit"
              disabled={verifyingAccess}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 disabled:bg-blue-300"
            >
              {verifyingAccess ? <Loader2 size={16} className="animate-spin" /> : null}
              {verifyingAccess ? "Verifying..." : "Open Admin Security"}
            </button>
          </form>
        </div>
      ) : null}

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Security</h1>
        <p className="text-gray-500 mt-1">Change admin password and manage admin access.</p>
        <p className="text-sm text-gray-700 mt-2">
          Admin Email ID: <span className="font-semibold">{currentAdminEmail || "Not available"}</span>
        </p>
        <p className="text-sm text-gray-700 mt-1">
          Primary Admin Email: <span className="font-semibold">{primaryAdminEmail || "kuremedi370@gmail.com"}</span>
        </p>
      </div>

      {errorMsg ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMsg}</div>
      ) : null}
      {successMsg ? (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMsg}</div>
      ) : null}
      {devOtp ? (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Dev OTP: <span className="font-semibold">{devOtp}</span>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl bg-white shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <KeyRound size={18} /> Change Password
          </h2>
          <p className="text-sm text-gray-500 mt-1">Enter current password and set a new password.</p>

          <form className="mt-5 space-y-4" onSubmit={handleChangePassword}>
            <input
              type="password"
              placeholder="Current password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
              required
            />
            <input
              type="password"
              placeholder="New password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
              required
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
              required
            />
            <button
              type="submit"
              disabled={savingPassword}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 disabled:bg-blue-300"
            >
              {savingPassword ? <Loader2 size={16} className="animate-spin" /> : null}
              {savingPassword ? "Updating..." : "Update Password"}
            </button>
          </form>
        </section>

        <section className="rounded-xl bg-white shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <UserPlus size={18} /> Add Admin
          </h2>
          <p className="text-sm text-gray-500 mt-1">Create another admin account with email and password.</p>
          {!isPrimaryAdmin ? (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Only the primary admin can add admin users.
            </div>
          ) : null}

          <form className="mt-5 space-y-4" onSubmit={handleAddAdmin}>
            <input
              type="text"
              placeholder="Full name"
              value={newAdminForm.name}
              onChange={(e) => setNewAdminForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={newAdminForm.email}
              onChange={(e) => setNewAdminForm((prev) => ({ ...prev, email: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
              required
            />
            <input
              type="tel"
              placeholder="Phone number"
              value={newAdminForm.phone}
              onChange={(e) => setNewAdminForm((prev) => ({ ...prev, phone: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={newAdminForm.password}
              onChange={(e) => setNewAdminForm((prev) => ({ ...prev, password: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
              required
            />
            <button
              type="submit"
              disabled={savingAdmin || !isPrimaryAdmin}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 disabled:bg-blue-300"
            >
              {savingAdmin ? <Loader2 size={16} className="animate-spin" /> : null}
              {savingAdmin ? "Adding..." : "Add Admin"}
            </button>
          </form>
        </section>
      </div>

      <section className="mt-6 rounded-xl bg-white shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Shield size={18} /> Security Questions
        </h2>
        <p className="text-sm text-gray-500 mt-1">Select 3 security questions and provide answers.</p>
        {loadingSecurityQuestions ? <p className="text-sm text-gray-500 mt-3">Loading saved questions...</p> : null}

        <form className="mt-5 space-y-4" onSubmit={handleSaveSecurityQuestions}>
          {securityQuestionsForm.map((item, index) => (
            <div key={index} className="grid gap-3 md:grid-cols-2">
              <label className="block text-sm font-medium text-gray-700">
                Security Question {index + 1}
                <select
                  value={item.question}
                  onChange={(e) => handleSecurityQuestionChange(index, "question", e.target.value)}
                  className="mt-2 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  required
                  disabled={savingSecurityQuestions}
                >
                  <option value="">Select a question</option>
                  {securityQuestionOptions.map((questionOption) => (
                    <option key={questionOption} value={questionOption}>
                      {questionOption}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-gray-700">
                Answer {index + 1}
                <input
                  type="text"
                  value={item.answer}
                  onChange={(e) => handleSecurityQuestionChange(index, "answer", e.target.value)}
                  placeholder="Enter answer"
                  className="mt-2 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  required
                  disabled={savingSecurityQuestions}
                />
              </label>
            </div>
          ))}

          <button
            type="submit"
            disabled={savingSecurityQuestions || loadingSecurityQuestions}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 disabled:bg-blue-300"
          >
            {savingSecurityQuestions ? <Loader2 size={16} className="animate-spin" /> : null}
            {savingSecurityQuestions ? "Saving..." : "Save Security Questions"}
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-xl bg-white shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Change Primary Email</h2>
            <p className="text-sm text-gray-500 mt-1">
              Verify the current email first, then verify the new email to complete the change.
            </p>
          </div>
          {!isPrimaryAdmin ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Only the primary admin can change the primary email.
            </div>
          ) : null}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-gray-700">
            Current Email
            <input
              type="email"
              value={emailChangeForm.currentEmail}
              onChange={(e) => setEmailChangeForm((prev) => ({ ...prev, currentEmail: e.target.value }))}
              className="mt-2 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
              required
              readOnly={!isPrimaryAdmin}
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            OTP Old Email
            <input
              type="text"
              value={emailChangeForm.oldEmailOtp}
              onChange={(e) => setEmailChangeForm((prev) => ({ ...prev, oldEmailOtp: e.target.value }))}
              placeholder="Enter OTP from current email"
              className="mt-2 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
              required
              disabled={!isPrimaryAdmin}
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Add New Email
            <input
              type="email"
              value={emailChangeForm.newEmail}
              onChange={(e) => setEmailChangeForm((prev) => ({ ...prev, newEmail: e.target.value }))}
              placeholder="new-email@example.com"
              className="mt-2 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
              required
              disabled={!isPrimaryAdmin}
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            OTP New Email
            <input
              type="text"
              value={emailChangeForm.newEmailOtp}
              onChange={(e) => setEmailChangeForm((prev) => ({ ...prev, newEmailOtp: e.target.value }))}
              placeholder="Enter OTP from new email"
              className="mt-2 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
              required
              disabled={!isPrimaryAdmin}
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleRequestOldEmailOtp}
            disabled={savingEmailChange || !isPrimaryAdmin || !emailChangeForm.currentEmail || !emailChangeForm.newEmail}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-blue-700 font-medium hover:bg-blue-100 disabled:opacity-60"
          >
            {savingEmailChange === "request-old" ? <Loader2 size={16} className="animate-spin" /> : null}
            Send OTP to Current Email
          </button>

          <button
            type="button"
            onClick={handleVerifyOldEmailOtp}
            disabled={savingEmailChange || !isPrimaryAdmin || !emailChangeForm.oldEmailOtp || !emailChangeForm.currentEmail || !emailChangeForm.newEmail}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 disabled:bg-blue-300"
          >
            {savingEmailChange === "verify-old" ? <Loader2 size={16} className="animate-spin" /> : null}
            Verify Old Email OTP
          </button>

          <button
            type="button"
            onClick={handleVerifyNewEmailOtp}
            disabled={savingEmailChange || !isPrimaryAdmin || !emailChangeForm.newEmailOtp || !emailChangeForm.currentEmail || !emailChangeForm.newEmail}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white font-medium hover:bg-emerald-700 disabled:bg-emerald-300"
          >
            {savingEmailChange === "verify-new" ? <Loader2 size={16} className="animate-spin" /> : null}
            Verify New Email OTP & Change
          </button>
        </div>
      </section>

      <section className="mt-6 rounded-xl bg-white shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Shield size={18} /> Current Admins
          </h2>
          <button
            type="button"
            onClick={loadAdmins}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <RefreshCcw size={14} /> Refresh
          </button>
        </div>

        {loadingAdmins ? (
          <div className="mt-4 text-sm text-gray-500">Loading admin list...</div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Phone</th>
                  <th className="py-2 pr-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin._id} className="border-b last:border-b-0">
                    <td className="py-3 pr-3 text-gray-900">{admin.name || "-"}</td>
                    <td className="py-3 pr-3 text-gray-700">{admin.email || "-"}</td>
                    <td className="py-3 pr-3 text-gray-700">{admin.phone || "-"}</td>
                    <td className="py-3 pr-3">
                      <button
                        type="button"
                        onClick={() => handleRemoveAdmin(admin._id)}
                        disabled={removingAdminId === admin._id || !isPrimaryAdmin}
                        className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-1.5 text-red-600 hover:bg-red-50 disabled:opacity-60"
                      >
                        <UserMinus size={14} />
                        {removingAdminId === admin._id ? "Removing..." : "Remove"}
                      </button>
                    </td>
                  </tr>
                ))}
                {admins.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-gray-500">
                      No admin users found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
