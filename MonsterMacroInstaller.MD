Monster Macro Installer v1.7
Quick Reference Guide — Roll20 D&D 5e (2014)
1. Installation
1. Open your Roll20 game's launch page.
2. Navigate to Settings → Mod (API) Scripts.
3. Create a new script named MonsterMacroInstaller.
4. Paste the JavaScript code into the script editor.
5. Save the script and launch your game.
You only need to install the script once per Roll20 game.
2. Setting up a new monster
1. Import or create a monster in Roll20.
2. Place the monster's token on the map.
3. Select the token.
4. Enter the following command in chat:
!setupnpc

 Copy
The installer automatically creates the appropriate macros and token action buttons, rolls the monster's hit points into Bar 3 and sets its armor class in Bar 1.
3. Available commands
Command	Description
!setupnpc	Complete monster and token setup
!setupnpc --all	Set up all selected monster tokens
!setupnpc --macros	Create or refresh macros without changing HP or AC
!setupnpc --all --macros	Refresh macros for all selected monsters without changing HP or AC
!setupnpc --token	Roll HP and set AC without changing macros
!setupnpc --help	Display available commands

4. Token action buttons
Buttons are automatically generated based on the contents of the NPC sheet.
Button prefix	Function
ATK	Actions and attacks, including automatic damage
BON	Bonus actions
REA	Reactions
LEG	Legendary actions
MYT	Mythic actions
TRT	Monster traits
Initiative	Roll initiative
Core Stats	Display ability scores and modifiers
Secondary Stats	Display AC, CR, senses, resistances and other information
Saving Throws	Roll all six saving throws
Spells	Display the spell selection dropdown

Only applicable buttons are created for each monster.
5. Casting spells
1. Select the monster's token.
2. Click the Spells button.
3. Choose a spell from the dropdown.
4. Click the resulting spell link in chat.
5. Select the casting level if prompted.
Roll20 handles the spell's normal rolls and effects.
6. Updating an existing monster
If you add, remove or change attacks, spells, traits or other abilities on an NPC sheet, select its token and run:
!setupnpc --macros

 Copy
The installer refreshes its generated macros without creating duplicates or modifying unrelated custom macros.
Important reminders
- The installer requires a Roll20 Pro subscription.
- It is designed for the D&D 5e 2014 NPC character sheet.
- Tokens must represent a character sheet.
- Attack damage rolls automatically, regardless of whether the attack hits.
- Running the standard !setupnpc command rerolls hit points.
- Use --macros when updating monsters already in combat.
- The v1.7 naming and migration changes have not yet been confirmed through live testing.
For everyday use, you really only need two commands: !setupnpc for new monsters and !setupnpc --macros for existing monsters.
