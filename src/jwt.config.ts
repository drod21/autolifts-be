import { jwt } from '@elysiajs/jwt'

export const jwtConfig = jwt({
  name: 'jwt_auth',
  secret:
    '2XDGIjKSj6aPHf5yw1GJ2B1Yj6kQcifS+QlP3QqdznVC0iRruTW/uhYZfqKuG95tsubxO65XPeRfoFWPshKlBw==',
})
