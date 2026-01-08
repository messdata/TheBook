// 'use client'

// import { useState, useEffect, Suspense } from 'react'
// import { useRouter, useSearchParams } from 'next/navigation'
// import { supabase } from '@/lib/supabase'
// import { motion, AnimatePresence } from 'framer-motion'
// import { Button } from '@/components/ui/button'
// import { Input } from '@/components/ui/input'
// import { Label } from '@/components/ui/label'
// import { Card } from '@/components/ui/card'
// import {
//   ArrowRight, ArrowLeft, Check, Sparkles, Sun, Moon,
//   ShieldCheck, Briefcase, Building2, AlertCircle
// } from 'lucide-react'

// const stepVariants = {
//   initial: { opacity: 0, x: 20, filter: 'blur(10px)' },
//   animate: { opacity: 1, x: 0, filter: 'blur(0px)' },
//   exit: { opacity: 0, x: -20, filter: 'blur(10px)' }
// }



// // Separate component that uses searchParams
// function OnboardingWizardContent() {
//   const router = useRouter()
//   const searchParams = useSearchParams()

//   // Initialize theme from localStorage or system preference
//   const [isDark, setIsDark] = useState(() => {
//     if (typeof window !== 'undefined') {
//       const stored = localStorage.getItem('theme')
//       if (stored) return stored === 'dark'
//       return window.matchMedia('(prefers-color-scheme: dark)').matches
//     }
//     return true
//   })

//   const [currentStep, setCurrentStep] = useState(1)
//   const [loading, setLoading] = useState(false)
//   const [userId, setUserId] = useState<string | null>(null)
//   const [errors, setErrors] = useState<Record<string, string>>({})

//   const [formData, setFormData] = useState({
//     firstName: '', surname: '', email: '',
//     profession: '', jobType: '', city: '', county: '', eir: '',
//     companyName: '', companyEmail: '', companyContact: '',
//     username: '', password: '', confirmPassword: '', phoneNumber: '',
//   })

//   // Persist theme changes
//   useEffect(() => {
//     const root = window.document.documentElement
//     if (isDark) {
//       root.classList.add('dark')
//       localStorage.setItem('theme', 'dark')
//     } else {
//       root.classList.remove('dark')
//       localStorage.setItem('theme', 'light')
//     }
//   }, [isDark])

//   useEffect(() => {
//     const checkUser = async () => {
//       const { data } = await supabase.auth.getUser()
//       if (data.user) {
//         setUserId(data.user.id)
//         if (data.user.user_metadata) {
//           setFormData(prev => ({
//             ...prev,
//             firstName: data.user.user_metadata.full_name?.split(' ')[0] || '',
//             surname: data.user.user_metadata.full_name?.split(' ').slice(1).join(' ') || '',
//             email: data.user.email || '',
//           }))
//         }
//       }
//       const step = searchParams.get('step')
//       if (step) setCurrentStep(parseInt(step))
//     }
//     checkUser()
//   }, [searchParams])

//   const handleInputChange = (field: string, value: string) => {
//     setFormData(prev => ({ ...prev, [field]: value }))
//     // Clear error when user starts typing
//     if (errors[field]) {
//       setErrors(prev => ({ ...prev, [field]: '' }))
//     }
//   }

//   const validatePassword = (password: string): string | null => {
//     if (password.length < 8) {
//       return 'Password must be at least 8 characters'
//     }
//     if (!/[A-Z]/.test(password)) {
//       return 'Password must contain at least one uppercase letter'
//     }
//     if (!/[a-z]/.test(password)) {
//       return 'Password must contain at least one lowercase letter'
//     }
//     if (!/[0-9]/.test(password)) {
//       return 'Password must contain at least one number'
//     }
//     return null
//   }

//   const handleGoogleSignIn = async () => {
//     setLoading(true)
//     const { error } = await supabase.auth.signInWithOAuth({
//       provider: 'google',
//       options: {
//         redirectTo: `${window.location.origin}/auth/callback?from=signup`,
//       },
//     })
//     if (error) {
//       alert('Google sign-in failed: ' + error.message)
//       setLoading(false)
//     }
//   }

//   const handleManualSignup = async () => {
//     if (!formData.email || !formData.firstName || !formData.surname) {
//       alert('Please fill all required fields')
//       return
//     }

//     setLoading(true)
//     const { data, error } = await supabase.auth.signUp({
//       email: formData.email,
//       password: 'temporary_password_12345', // Will be changed in Step 4
//       options: {
//         data: { full_name: `${formData.firstName} ${formData.surname}` },
//       },
//     })

//     if (error) {
//       alert(error.message)
//       setLoading(false)
//       return
//     }

//     if (data.user) {
//       setUserId(data.user.id)
//       await supabase.from('user_profiles').insert({
//         user_id: data.user.id,
//         email: formData.email,
//         first_name: formData.firstName,
//         surname: formData.surname,
//         auth_provider: 'email',
//         onboarding_completed: false,
//       })
//       setCurrentStep(2)
//     }
//     setLoading(false)
//   }

//   const handleStep2Next = () => {
//     const newErrors: Record<string, string> = {}

//     if (!formData.profession) newErrors.profession = 'Profession is required'
//     if (!formData.jobType) newErrors.jobType = 'Job type is required'
//     if (!formData.city) newErrors.city = 'City is required'
//     if (!formData.county) newErrors.county = 'County is required'
//     if (!formData.eir) newErrors.eir = 'Eircode is required'

//     if (Object.keys(newErrors).length > 0) {
//       setErrors(newErrors)
//       return
//     }

//     setCurrentStep(3)
//   }

//   const handleStep3Next = () => {
//     const newErrors: Record<string, string> = {}

//     if (!formData.companyName) newErrors.companyName = 'Company name is required'

//     if (Object.keys(newErrors).length > 0) {
//       setErrors(newErrors)
//       return
//     }

//     setCurrentStep(4)
//   }

//   const handleFinalSubmit = async () => {
//     const newErrors: Record<string, string> = {}

//     if (!formData.username) newErrors.username = 'Username is required'
//     if (!formData.password) newErrors.password = 'Password is required'
//     if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm password'

//     if (formData.password) {
//       const passwordError = validatePassword(formData.password)
//       if (passwordError) newErrors.password = passwordError
//     }

//     if (formData.password !== formData.confirmPassword) {
//       newErrors.confirmPassword = 'Passwords do not match'
//     }

//     if (Object.keys(newErrors).length > 0) {
//       setErrors(newErrors)
//       return
//     }

//     setLoading(true)
//     await supabase.auth.updateUser({ password: formData.password })

//     const { error } = await supabase.from('user_profiles').update({
//       profession: formData.profession,
//       job_type: formData.jobType,
//       city: formData.city,
//       county: formData.county,
//       eir: formData.eir,
//       company_name: formData.companyName,
//       company_email: formData.companyEmail,
//       company_contact: formData.companyContact,
//       username: formData.username,
//       phone_number: formData.phoneNumber,
//       onboarding_completed: true,
//     }).eq('user_id', userId)

//     if (error) {
//       setErrors({ submit: 'Error completing profile: ' + error.message })
//       setLoading(false)
//       return
//     }

//     router.push('/dashboard')
//   }

//   const glassPanel = isDark
//     ? "bg-slate-900/60 border-slate-800/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.8)]"
//     : "bg-white/50 border-slate-200/40 shadow-[0_8px_32px_0_rgba(100,116,139,0.12)]"

//   const glassInput = "bg-slate-100/40 dark:bg-black/20 border-slate-300/40 dark:border-white/10 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/50 transition-all rounded-xl text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400"

//   return (
//     <div className={`relative min-h-screen w-full flex items-center justify-center p-4 transition-colors duration-700 ${isDark ? 'bg-[#020617]' : 'bg-slate-50'}`}>

//       <div className="absolute inset-0 overflow-hidden pointer-events-none">
//         <motion.div
//           animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
//           transition={{ duration: 20, repeat: Infinity }}
//           className="absolute -top-[10%] -left-[10%] w-[500px] h-[500px] rounded-full bg-blue-500/30 dark:bg-blue-500/10 blur-[120px]"
//         />
//         <motion.div
//           animate={{ x: [0, -80, 0], y: [0, -100, 0], scale: [1, 1.3, 1] }}
//           transition={{ duration: 15, repeat: Infinity }}
//           className="absolute -bottom-[10%] -right-[10%] w-[600px] h-[600px] rounded-full bg-purple-500/30 dark:bg-indigo-500/10 blur-[120px]"
//         />
//       </div>

//       <Button
//         variant="ghost" // Changed from "outline"
//         size="icon"
//         onClick={() => setIsDark(!isDark)}
//         // Removed "border-white/20" from className
//         className="fixed top-8 right-8 z-50 rounded-full w-12 h-12 backdrop-blur-xl bg-white/10 dark:bg-white/5 hover:scale-110 active:scale-95 transition-all"
//       >
//         {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
//       </Button>

//       <motion.div
//         initial={{ opacity: 0, y: 30 }}
//         animate={{ opacity: 1, y: 0 }}
//         className="relative z-10 w-full max-w-2xl"
//       >
//         <Card className={`backdrop-blur-3xl border ${glassPanel} rounded-[2.5rem] overflow-hidden`}>
//           <div className="p-8 md:p-12">

//             <div className="flex items-center justify-between mb-12">
//               <div className="flex gap-3">
//                 {[1, 2, 3, 4].map((i) => (
//                   <motion.div
//                     key={i}
//                     animate={{
//                       width: currentStep === i ? 48 : 12,
//                       backgroundColor: currentStep >= i ? '#3b82f6' : (isDark ? '#1e293b' : '#e2e8f0')
//                     }}
//                     className="h-2 rounded-full transition-colors"
//                   />
//                 ))}
//               </div>
//             </div>

//             <AnimatePresence mode="wait">
//               <motion.div
//                 key={currentStep}
//                 variants={stepVariants}
//                 initial="initial"
//                 animate="animate"
//                 exit="exit"
//                 transition={{ duration: 0.5, ease: "anticipate" }}
//               >
//                 {currentStep === 1 && (
//                   <div className="space-y-8">
//                     <header>
//                       <h2 className="text-4xl font-extrabold tracking-tight mb-2 text-slate-900 dark:text-white">Welcome.</h2>
//                       <p className="text-slate-600 dark:text-muted-foreground">Join the elite network with one click.</p>
//                     </header>

//                     <Button
//                       onClick={handleGoogleSignIn}
//                       disabled={loading}
//                       className="w-full h-16 rounded-2xl bg-white text-black hover:bg-slate-100 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 flex items-center justify-center gap-3 text-lg font-semibold transition-all shadow-xl"
//                     >
//                       <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="G" />
//                       Continue with Google
//                     </Button>

//                     <div className="relative flex items-center gap-4 py-2">
//                       <div className="flex-1 h-[1px] bg-slate-200 dark:bg-white/10" />
//                       <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-muted-foreground">Or </span>
//                       <div className="flex-1 h-[1px] bg-slate-200 dark:bg-white/10" />
//                     </div>

//                     <div className="grid grid-cols-2 gap-4">
//                       <div className="space-y-2">
//                         <Label className="text-xs uppercase tracking-tighter ml-1 text-slate-700 dark:text-slate-300">First Name</Label>
//                         <Input className={glassInput} placeholder="Alex" value={formData.firstName} onChange={e => handleInputChange('firstName', e.target.value)} />
//                       </div>
//                       <div className="space-y-2">
//                         <Label className="text-xs uppercase tracking-tighter ml-1 text-slate-700 dark:text-slate-300">Surname</Label>
//                         <Input className={glassInput} placeholder="Rivera" value={formData.surname} onChange={e => handleInputChange('surname', e.target.value)} />
//                       </div>
//                     </div>

//                     <div className="space-y-2">
//                       <Label className="text-xs uppercase tracking-tighter ml-1 text-slate-700 dark:text-slate-300">Email Address</Label>
//                       <Input type="email" className={glassInput} placeholder="alex@work.com" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} />
//                     </div>

//                     <Button onClick={handleManualSignup} disabled={loading} className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl group text-lg">
//                       Begin Onboarding <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
//                     </Button>
//                   </div>
//                 )}

//                 {currentStep === 2 && (
//                   <div className="space-y-6">
//                     <div className="flex items-center gap-4 mb-8">
//                       <div className="p-4 bg-blue-500/20 rounded-2xl"><Briefcase className="text-blue-500 w-6 h-6" /></div>
//                       <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Expertise.</h2>
//                     </div>

//                     <div className="space-y-4">
//                       <div className="space-y-2">
//                         <Label className="text-slate-700 dark:text-slate-300">Profession *</Label>
//                         <Input
//                           className={`${glassInput} ${errors.profession ? 'border-red-500 focus:ring-red-500' : ''}`}
//                           placeholder="Full Stack Developer"
//                           value={formData.profession}
//                           onChange={e => handleInputChange('profession', e.target.value)}
//                         />
//                         {errors.profession && (
//                           <div className="flex items-center gap-1.5 text-red-500 text-xs mt-1">
//                             <AlertCircle className="w-3 h-3" />
//                             <span>{errors.profession}</span>
//                           </div>
//                         )}
//                       </div>
//                       <div className="space-y-2">
//                         <Label className="text-slate-700 dark:text-slate-300">Job Type *</Label>
//                         <select
//                           value={formData.jobType}
//                           onChange={e => handleInputChange('jobType', e.target.value)}
//                           className={`w-full h-12 px-4 ${glassInput} ${errors.jobType ? 'border-red-500 focus:ring-red-500' : ''}`}
//                         >
//                           <option value="">Select</option>
//                           <option value="full-time">Full-time</option>
//                           <option value="part-time">Part-time</option>
//                           <option value="contract">Contract</option>
//                           <option value="student">Student</option>
//                         </select>
//                         {errors.jobType && (
//                           <div className="flex items-center gap-1.5 text-red-500 text-xs mt-1">
//                             <AlertCircle className="w-3 h-3" />
//                             <span>{errors.jobType}</span>
//                           </div>
//                         )}
//                       </div>
//                       <div className="grid grid-cols-2 gap-4">
//                         <div className="space-y-2">
//                           <Label className="text-slate-700 dark:text-slate-300">City *</Label>
//                           <Input
//                             className={`${glassInput} ${errors.city ? 'border-red-500 focus:ring-red-500' : ''}`}
//                             placeholder="Dublin"
//                             value={formData.city}
//                             onChange={e => handleInputChange('city', e.target.value)}
//                           />
//                           {errors.city && (
//                             <div className="flex items-center gap-1.5 text-red-500 text-xs mt-1">
//                               <AlertCircle className="w-3 h-3" />
//                               <span>{errors.city}</span>
//                             </div>
//                           )}
//                         </div>
//                         <div className="space-y-2">
//                           <Label className="text-slate-700 dark:text-slate-300">County *</Label>
//                           <Input
//                             className={`${glassInput} ${errors.county ? 'border-red-500 focus:ring-red-500' : ''}`}
//                             placeholder="Co. Dublin"
//                             value={formData.county}
//                             onChange={e => handleInputChange('county', e.target.value)}
//                           />
//                           {errors.county && (
//                             <div className="flex items-center gap-1.5 text-red-500 text-xs mt-1">
//                               <AlertCircle className="w-3 h-3" />
//                               <span>{errors.county}</span>
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                       <div className="space-y-2">
//                         <Label className="text-slate-700 dark:text-slate-300">Eircode *</Label>
//                         <Input
//                           className={`${glassInput} ${errors.eir ? 'border-red-500 focus:ring-red-500' : ''}`}
//                           placeholder="D02 XY45"
//                           value={formData.eir}
//                           onChange={e => handleInputChange('eir', e.target.value)}
//                         />
//                         {errors.eir && (
//                           <div className="flex items-center gap-1.5 text-red-500 text-xs mt-1">
//                             <AlertCircle className="w-3 h-3" />
//                             <span>{errors.eir}</span>
//                           </div>
//                         )}
//                       </div>
//                     </div>

//                     <div className="flex gap-4 pt-6">
//                       <Button variant="ghost" onClick={() => setCurrentStep(1)} className="flex-1 h-14 rounded-2xl text-slate-700 dark:text-slate-300">Back</Button>
//                       <Button onClick={handleStep2Next} className="flex-[2] h-14 bg-blue-600 text-white rounded-2xl">Continue</Button>
//                     </div>
//                   </div>
//                 )}

//                 {currentStep === 3 && (
//                   <div className="space-y-6">
//                     <div className="flex items-center gap-4 mb-8">
//                       <div className="p-4 bg-purple-500/20 rounded-2xl"><Building2 className="text-purple-500 w-6 h-6" /></div>
//                       <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Workspace.</h2>
//                     </div>
//                     <div className="space-y-4">
//                       <div className="space-y-2">
//                         <Label className="text-slate-700 dark:text-slate-300">Company Name *</Label>
//                         <Input
//                           className={`${glassInput} ${errors.companyName ? 'border-red-500 focus:ring-red-500' : ''}`}
//                           placeholder="TechCorp Inc."
//                           value={formData.companyName}
//                           onChange={e => handleInputChange('companyName', e.target.value)}
//                         />
//                         {errors.companyName && (
//                           <div className="flex items-center gap-1.5 text-red-500 text-xs mt-1">
//                             <AlertCircle className="w-3 h-3" />
//                             <span>{errors.companyName}</span>
//                           </div>
//                         )}
//                       </div>
//                       <div className="space-y-2">
//                         <Label className="text-slate-700 dark:text-slate-300">Company Email</Label>
//                         <Input className={glassInput} placeholder="hr@company.com" value={formData.companyEmail} onChange={e => handleInputChange('companyEmail', e.target.value)} />
//                       </div>
//                       <div className="space-y-2">
//                         <Label className="text-slate-700 dark:text-slate-300">Company Contact</Label>
//                         <Input className={glassInput} placeholder="+353 1 234 5678" value={formData.companyContact} onChange={e => handleInputChange('companyContact', e.target.value)} />
//                       </div>
//                     </div>
//                     <div className="flex gap-4 pt-6">
//                       <Button variant="ghost" onClick={() => setCurrentStep(2)} className="flex-1 h-14 rounded-2xl text-slate-700 dark:text-slate-300">Back</Button>
//                       <Button onClick={handleStep3Next} className="flex-[2] h-14 bg-blue-600 text-white rounded-2xl">Continue</Button>
//                     </div>
//                   </div>
//                 )}

//                 {currentStep === 4 && (
//                   <div className="space-y-6">
//                     <div className="flex items-center gap-4 mb-8">
//                       <div className="p-4 bg-green-500/20 rounded-2xl"><ShieldCheck className="text-green-500 w-6 h-6" /></div>
//                       <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Secure.</h2>
//                     </div>
//                     <div className="grid grid-cols-1 gap-4">
//                       <div className="space-y-2">
//                         <Label className="text-slate-700 dark:text-slate-300">Username *</Label>
//                         <Input
//                           className={`${glassInput} ${errors.username ? 'border-red-500 focus:ring-red-500' : ''}`}
//                           value={formData.username}
//                           onChange={e => handleInputChange('username', e.target.value)}
//                         />
//                         {errors.username && (
//                           <div className="flex items-center gap-1.5 text-red-500 text-xs mt-1">
//                             <AlertCircle className="w-3 h-3" />
//                             <span>{errors.username}</span>
//                           </div>
//                         )}
//                       </div>
//                       <div className="space-y-2">
//                         <Label className="text-slate-700 dark:text-slate-300">Phone Number</Label>
//                         <Input className={glassInput} placeholder="+353..." value={formData.phoneNumber} onChange={e => handleInputChange('phoneNumber', e.target.value)} />
//                       </div>
//                       <div className="grid grid-cols-2 gap-4">
//                         <div className="space-y-2">
//                           <Label className="text-slate-700 dark:text-slate-300">Password *</Label>
//                           <Input
//                             type="password"
//                             className={`${glassInput} ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
//                             value={formData.password}
//                             onChange={e => handleInputChange('password', e.target.value)}
//                           />
//                           {errors.password && (
//                             <div className="flex items-center gap-1.5 text-red-500 text-xs mt-1">
//                               <AlertCircle className="w-3 h-3" />
//                               <span>{errors.password}</span>
//                             </div>
//                           )}
//                           {!errors.password && formData.password && (
//                             <div className="space-y-1 mt-2">
//                               <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Requirements:</p>
//                               <div className={`flex items-center gap-1.5 text-xs ${formData.password.length >= 8 ? 'text-green-600' : 'text-slate-400'}`}>
//                                 <div className="w-1 h-1 rounded-full bg-current" />
//                                 <span>8+ characters</span>
//                               </div>
//                               <div className={`flex items-center gap-1.5 text-xs ${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-slate-400'}`}>
//                                 <div className="w-1 h-1 rounded-full bg-current" />
//                                 <span>Uppercase letter</span>
//                               </div>
//                               <div className={`flex items-center gap-1.5 text-xs ${/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-slate-400'}`}>
//                                 <div className="w-1 h-1 rounded-full bg-current" />
//                                 <span>Lowercase letter</span>
//                               </div>
//                               <div className={`flex items-center gap-1.5 text-xs ${/[0-9]/.test(formData.password) ? 'text-green-600' : 'text-slate-400'}`}>
//                                 <div className="w-1 h-1 rounded-full bg-current" />
//                                 <span>Number</span>
//                               </div>
//                             </div>
//                           )}
//                         </div>
//                         <div className="space-y-2">
//                           <Label className="text-slate-700 dark:text-slate-300">Confirm *</Label>
//                           <Input
//                             type="password"
//                             className={`${glassInput} ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
//                             value={formData.confirmPassword}
//                             onChange={e => handleInputChange('confirmPassword', e.target.value)}
//                           />
//                           {errors.confirmPassword && (
//                             <div className="flex items-center gap-1.5 text-red-500 text-xs mt-1">
//                               <AlertCircle className="w-3 h-3" />
//                               <span>{errors.confirmPassword}</span>
//                             </div>
//                           )}
//                           {!errors.confirmPassword && formData.confirmPassword && formData.password === formData.confirmPassword && (
//                             <div className="flex items-center gap-1.5 text-green-600 text-xs mt-1">
//                               <Check className="w-3 h-3" />
//                               <span>Passwords match</span>
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                     </div>

//                     {errors.submit && (
//                       <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
//                         <AlertCircle className="w-4 h-4" />
//                         <span>{errors.submit}</span>
//                       </div>
//                     )}

//                     <div className="flex gap-4 pt-6">
//                       <Button variant="ghost" onClick={() => setCurrentStep(3)} className="flex-1 h-14 rounded-2xl text-slate-700 dark:text-slate-300">Back</Button>
//                       <Button onClick={handleFinalSubmit} disabled={loading} className="flex-[2] h-14 bg-green-600 hover:bg-green-700 text-white rounded-2xl shadow-lg shadow-green-500/20">
//                         Finish Setup <Check className="ml-2 w-5 h-5" />
//                       </Button>
//                     </div>
//                   </div>
//                 )}
//               </motion.div>
//             </AnimatePresence>
//           </div>
//         </Card>

//         <p className="mt-8 text-center text-xs font-bold tracking-[0.3em] uppercase opacity-30 flex items-center justify-center gap-2 text-slate-900 dark:text-white">
//           <Sparkles className="w-3 h-3" /> Smart Money = More Moeny
//         </p>
//       </motion.div>
//     </div>
//   )
// }

// // Main export with Suspense boundary
// export default function OnboardingWizard() {
//   return (
//     <Suspense fallback={
//       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
//         <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
//       </div>
//     }>
//       <OnboardingWizardContent />
//     </Suspense>
//   )
// }