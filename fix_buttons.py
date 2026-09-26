import os
file1 = r'c:\Users\r3x\TheDirtyKitchen\frontend\src\pages\admin\InternalCoachesPage.tsx'
content1 = open(file1, 'r', encoding='utf-8').read()
content1 = content1.replace('''                      <div className="flex items-center gap-2 justify-end">
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleOpen(profile)}>
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1.5 text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400" onClick={() => handleDelete(profile.id)}>
                          <Trash className="h-3.5 w-3.5" /> Delete
                        </Button>
                      </div>'''.replace('\n', '\r\n'), '''                      <div className="flex items-center gap-1 justify-end">
                        <TooltipProvider><Tooltip delayDuration={200}><TooltipTrigger asChild>
                          <Button size="icon" variant="ghost" onClick={() => handleOpen(profile)}>
                            <Pencil className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                          </Button>
                        </TooltipTrigger><TooltipContent className="bg-primary text-primary-foreground font-semibold rounded-lg px-2.5 py-1.5">Edit</TooltipContent></Tooltip></TooltipProvider>
                        
                        <TooltipProvider><Tooltip delayDuration={200}><TooltipTrigger asChild>
                          <Button size="icon" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => handleDelete(profile.id)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger><TooltipContent className="bg-primary text-primary-foreground font-semibold rounded-lg px-2.5 py-1.5">Delete</TooltipContent></Tooltip></TooltipProvider>
                      </div>'''.replace('\n', '\r\n'))
open(file1, 'w', encoding='utf-8', newline='').write(content1)

file2 = r'c:\Users\r3x\TheDirtyKitchen\frontend\src\pages\admin\PromosPage.tsx'
content2 = open(file2, 'r', encoding='utf-8').read()
content2 = content2.replace('''                    <div className="flex items-center gap-2 justify-end">
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleOpen(promo)}>
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1.5 text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400" onClick={() => { if(window.confirm('Delete this promo?')) deletePromo(promo.id); }}>
                        <Trash className="h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>'''.replace('\n', '\r\n'), '''                    <div className="flex items-center gap-1 justify-end">
                      <TooltipProvider><Tooltip delayDuration={200}><TooltipTrigger asChild>
                        <Button size="icon" variant="ghost" onClick={() => handleOpen(promo)}>
                          <Pencil className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        </Button>
                      </TooltipTrigger><TooltipContent className="bg-primary text-primary-foreground font-semibold rounded-lg px-2.5 py-1.5">Edit</TooltipContent></Tooltip></TooltipProvider>
                      
                      <TooltipProvider><Tooltip delayDuration={200}><TooltipTrigger asChild>
                        <Button size="icon" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => { if(window.confirm('Delete this promo?')) deletePromo(promo.id); }}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger><TooltipContent className="bg-primary text-primary-foreground font-semibold rounded-lg px-2.5 py-1.5">Delete</TooltipContent></Tooltip></TooltipProvider>
                    </div>'''.replace('\n', '\r\n'))
open(file2, 'w', encoding='utf-8', newline='').write(content2)
