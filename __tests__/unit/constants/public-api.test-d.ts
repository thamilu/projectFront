import * as Constants from '@/shared/constants';
import type { ConstantsPublicApi } from '@/shared/constants/types';

// This assignment fails compilation if the real barrel is missing any
// property ConstantsPublicApi declares, or has an incompatible type for one.
// Do NOT route this through `as unknown as ConstantsPublicApi` — that
// double-cast forces the expression's type before the assignment happens,
// which silently defeats the entire check (verified: with the cast, this
// file compiled successfully even after ConstantsPublicApi was edited to
// require nonexistent barrel exports).
const _apiCheck: ConstantsPublicApi = Constants;
