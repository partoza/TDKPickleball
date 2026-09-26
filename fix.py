import os
file1 = r'c:\Users\r3x\TheDirtyKitchen\frontend\src\pages\admin\InternalCoachesPage.tsx'
content1 = open(file1, 'r', encoding='utf-8').read()
content1 = content1.replace('''                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 rounded-xl">
                          <DropdownMenuItem onClick={() => handleOpen(profile)} className="rounded-lg gap-2 cursor-pointer text-slate-600 dark:text-slate-300"><Pencil className="h-4 w-4" /> Edit details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(profile.id)} className="rounded-lg gap-2 cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700 dark:text-red-400 dark:focus:bg-red-950/50"><Trash className="h-4 w-4" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>'''.replace('\n', '\r\n'), '''                      <div className="flex items-center gap-2 justify-end">
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleOpen(profile)}>
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1.5 text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400" onClick={() => handleDelete(profile.id)}>
                          <Trash className="h-3.5 w-3.5" /> Delete
                        </Button>
                      </div>'''.replace('\n', '\r\n'))
open(file1, 'w', encoding='utf-8', newline='').write(content1)

file2 = r'c:\Users\r3x\TheDirtyKitchen\frontend\src\pages\admin\PromosPage.tsx'
content2 = open(file2, 'r', encoding='utf-8').read()
content2 = content2.replace('''                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 rounded-xl">
                        <DropdownMenuItem onClick={() => handleOpen(promo)} className="cursor-pointer">Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { if(window.confirm('Delete this promo?')) deletePromo(promo.id); }} className="cursor-pointer text-red-600 focus:text-red-600">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>'''.replace('\n', '\r\n'), '''                    <div className="flex items-center gap-2 justify-end">
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleOpen(promo)}>
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1.5 text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400" onClick={() => { if(window.confirm('Delete this promo?')) deletePromo(promo.id); }}>
                        <Trash className="h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>'''.replace('\n', '\r\n'))
open(file2, 'w', encoding='utf-8', newline='').write(content2)
