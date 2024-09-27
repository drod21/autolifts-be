const hashPassword = async (password: string) => {
  const hashedPassword = await Bun.password.hash(password)
  return hashedPassword
}

const verifyPassword = async (password: string, hashedPassword: string) => {
  console.log('password', password)
  console.log('hashedPassword', hashedPassword)
  const isPasswordValid = await Bun.password.verify(password, hashedPassword)
  return isPasswordValid
}

const generateUuid = () => {
  return crypto.randomUUID()
}

export { hashPassword, verifyPassword, generateUuid }
