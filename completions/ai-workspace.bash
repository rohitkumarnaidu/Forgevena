_ai_workspace(){ local commands="doctor status validate version help init create add remove update upgrade rollback install reference capabilities integrations credentials providers mcp plugins cloud dashboard docker templates config"; COMPREPLY=( $(compgen -W "$commands" -- "${COMP_WORDS[COMP_CWORD]}") ); }
complete -F _ai_workspace ai-workspace
