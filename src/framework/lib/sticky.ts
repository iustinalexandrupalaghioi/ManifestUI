/**
 * The framework's sticky rule for record screens: the record's header (title,
 * toolbar, tab list) stays in view, and so does the header row of whatever a
 * tab shows (a list's toolbar, a blocks field's header…), just below it.
 *
 * With `detail.formInTabs` the record header doesn't move and the active tab's
 * content is its own scroll area; RecordTabs sets `--record-sticky-top: 0` on
 * it, so a header that adds `STICKY_IN_RECORD` sticks to that area's top.
 * Outside a record's tabs the variable isn't set, so `top` stays auto and
 * nothing sticks.
 */
export const STICKY_IN_RECORD = "sticky top-(--record-sticky-top) z-10 bg-background";
