import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import type { useUserMutations } from "@/hooks/useUsers"
import type { User } from "@/types/users"
import type { UserProfileFormApi } from "@/types/users/profile-form"

interface UserProfileValues {
  name: string
  lastName: string
  email: string
  birthDay: string
  birthMonth: string
  photoFile: string
}

function valuesFromUser(user: User): UserProfileValues {
  return {
    name: user.name || "",
    lastName: user.last_name || "",
    email: user.email || "",
    birthDay: user.birth_day ? String(user.birth_day) : "",
    birthMonth: user.birth_month ? String(user.birth_month) : "",
    photoFile: "",
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Formulario plano del tab "Perfil" — ver `UserProfileFormApi`. Reemplaza a
 * `EditUserSheet` en /users. Hidratación gateada por `isDirty`
 * (ia context/sheet-footer-batch-save-guide.md regla 3): el usuario puede
 * refrescarse desde `userQueryKeys.listBase()` (ej. al guardar el tab Roles)
 * mientras se edita el perfil acá — mismo patrón que `useRoleDetailsForm`.
 */
export function useUserProfileForm(
  user: User | null,
  canUpdate: boolean,
  userMutations: ReturnType<typeof useUserMutations>,
): UserProfileFormApi {
  const { t } = useTranslation("users")
  const [values, setValues] = useState<UserProfileValues>({
    name: "",
    lastName: "",
    email: "",
    birthDay: "",
    birthMonth: "",
    photoFile: "",
  })
  const [fileError, setFileError] = useState<string | undefined>(undefined)
  const baselineRef = useRef<UserProfileValues>(values)

  const isDirty =
    values.name !== baselineRef.current.name ||
    values.lastName !== baselineRef.current.lastName ||
    values.email !== baselineRef.current.email ||
    values.birthDay !== baselineRef.current.birthDay ||
    values.birthMonth !== baselineRef.current.birthMonth ||
    values.photoFile !== baselineRef.current.photoFile

  useEffect(() => {
    if (!user || isDirty) return
    const loaded = valuesFromUser(user)
    baselineRef.current = loaded
    setValues(loaded)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isDirty])

  const errors: Record<string, string> = {}
  if (!values.name.trim()) errors.name = t("validation.nameRequired")
  if (!values.lastName.trim()) errors.last_name = t("validation.lastNameRequired")
  if (!values.email.trim()) errors.email = t("validation.emailRequired")
  else if (!EMAIL_RE.test(values.email)) errors.email = t("validation.emailInvalid")
  if (fileError) errors.photo_file = fileError

  const discard = useCallback(() => {
    setValues(baselineRef.current)
    setFileError(undefined)
  }, [])

  const onFileChange = useCallback((files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setFileError(t("validation.invalidImageFile"))
      return
    }
    setFileError(undefined)
    const reader = new FileReader()
    reader.onloadend = () => {
      setValues((prev) => ({ ...prev, photoFile: reader.result as string }))
    }
    reader.readAsDataURL(file)
  }, [t])

  const canSave = isDirty && Object.keys(errors).length === 0

  const saveRef = useRef<() => Promise<void>>(async () => {})
  saveRef.current = async () => {
    if (!user || !canUpdate || !canSave) return
    const { name, lastName, email, birthDay, birthMonth, photoFile } = values
    await userMutations.updateUser.mutateAsync({
      userId: user.id,
      data: {
        name: name.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        ...(birthDay ? { birth_day: parseInt(birthDay, 10) } : {}),
        ...(birthMonth ? { birth_month: parseInt(birthMonth, 10) } : {}),
        ...(photoFile ? { photo_file: photoFile } : {}),
      },
    })
    baselineRef.current = { ...values, photoFile: "" }
    setValues(baselineRef.current)
    setFileError(undefined)
  }
  const save = useCallback(() => saveRef.current(), [])

  return {
    name: values.name,
    lastName: values.lastName,
    email: values.email,
    birthDay: values.birthDay,
    birthMonth: values.birthMonth,
    photoFile: values.photoFile,
    setName: (v) => setValues((prev) => ({ ...prev, name: v })),
    setLastName: (v) => setValues((prev) => ({ ...prev, lastName: v })),
    setBirthDay: (v) => setValues((prev) => ({ ...prev, birthDay: v })),
    setBirthMonth: (v) => setValues((prev) => ({ ...prev, birthMonth: v })),
    onFileChange,
    errors,
    canSave,
    isDirty,
    isSaving: userMutations.updateUser.isPending,
    save,
    discard,
  }
}
