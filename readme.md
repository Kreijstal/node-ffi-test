#winffiapi

ffi bindings and helper functions for win32api.
-----
Okay so you're probably wondering why this exist, if there is already another package that handles the windows ffi api https://github.com/waitingsong/node-win32-api
The reason is, well, I don't know typescript, and I wanted to understand the win32 api myself anyway.
Typescript is not compatible with the way I work, since I tend to use the repl a bit too much. and yes I know you can use typescript on the repl, but I like the idea of interpreted languages, not of compiled languages, if I wanted a compiled languages I would use rust.
I do have to document the utilities that make it easier to use, but otherwise just use this as the bindings. No, not all of them are implemented. Read the code to see how everything works, create an issue if you have questions.