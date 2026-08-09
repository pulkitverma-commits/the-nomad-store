// How much vertical space the header pill takes out of the top of every page.
//
// The pill is `position: sticky; top: 16` with a 64px body, so it stays in
// normal flow and reserves 64px, then paints 16px lower. Pages that open on a
// white background never notice. Pages that open on a colour band show that
// reserve as a white strip above the colour — reported on /about, and equally
// true of /voices, /drops and every country page.
//
// The fix is the one the homepage hero already does inline: pull the band up
// by this much and hand the same amount back as top padding, so the colour
// runs to the top of the window while the type stays exactly where it was.
// The number lives here so the four pages that need it cannot drift apart.
export const NAV_RESERVE = 80;
