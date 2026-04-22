/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, Image as ImageIcon, Settings, Play, 
  Wand2, ChevronRight, Download, Eye, Layers, Mic, Music, 
  Loader2, Maximize2
} from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

import { ProductData, AdStrategy, ProjectState } from './types';
import { generateAdStrategy, generatePosterImage, generateVoiceover } from './lib/gemini';

const STEPS = [
  { id: 1, title: 'Product Input', icon: Upload },
  { id: 2, title: 'AI Analysis', icon: Wand2 },
  { id: 3, title: 'Creative Generation', icon: Layers },
  { id: 4, title: 'Review & Export', icon: Play },
];

export default function App() {
  const [state, setState] = useState<ProjectState>({
    step: 1,
    productKey: null,
    productData: null,
    strategyKey: null,
    strategy: null,
    isGenerating: false,
  });

  const handleNextStep = () => {
    setState(s => ({ ...s, step: Math.min(s.step + 1, STEPS.length) }));
  };

  const handlePrevStep = () => {
    setState(s => ({ ...s, step: Math.max(s.step - 1, 1) }));
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-border flex items-center justify-between px-8 bg-popover">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-white flex items-center justify-center rounded-sm">
            <div className="w-4 h-4 bg-black rotate-45"></div>
          </div>
          <h1 className="text-xs font-bold tracking-[0.3em] uppercase">AdCreate AI / Engine</h1>
        </div>
        
        <div className="flex items-center space-x-8">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center gap-3">
              <span className={`text-[10px] uppercase tracking-widest ${state.step >= step.id ? 'text-white' : 'text-white/40'}`}>
                {step.id}. {step.title}
              </span>
              {index < STEPS.length - 1 && (
                <div className="w-4 h-[1px] bg-white/20"></div>
              )}
            </div>
          ))}
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="flex space-x-2 items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
            <span className="text-[10px] uppercase tracking-widest text-white/50">System Active</span>
          </div>
          <div className="h-8 w-[1px] bg-white/10"></div>
           <Button variant="outline" className="border-border text-[10px] uppercase tracking-widest rounded-none h-8" onClick={() => setState({ step: 1, productData: null, strategy: null, isGenerating: false, productKey: null, strategyKey: null })}>
             New Project
           </Button>
           <Button variant="outline" className="border-border text-[10px] uppercase tracking-widest rounded-none h-8">
             Settings
           </Button>
        </div>
      </header>

      {/* Main Area */}
      <main className="flex-1 flex overflow-hidden">
        <AnimatePresence mode="wait">
          {state.step === 1 && <Step1Input key="step1" state={state} setState={setState} onNext={handleNextStep} />}
          {state.step === 2 && <Step2Analysis key="step2" state={state} setState={setState} onNext={handleNextStep} onPrev={handlePrevStep} />}
          {state.step === 3 && <Step3Generation key="step3" state={state} setState={setState} onNext={handleNextStep} />}
          {state.step === 4 && <Step4Review key="step4" state={state} setState={setState} />}
        </AnimatePresence>
      </main>

       {/* Bottom Status Bar */}
      <footer className="h-10 border-t border-border bg-black px-6 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-white/40 font-mono flex-shrink-0">
        <div className="flex space-x-6">
          <span>GPU-CORE-01: 42°C</span>
          <span>NETWORK: SYNCED</span>
        </div>
        <div className="flex space-x-6">
          <span>AI_ENGINE: GEMINI_2.5_FLASH</span>
          <span className="text-white">LAST SAVED: {new Date().toLocaleTimeString()}</span>
        </div>
      </footer>
    </div>
  );
}

// ----- STEPS COMPONENTS (Mockups to be implemented properly) -----

function Step1Input({ state, setState, onNext }: any) {
  const [formData, setFormData] = useState<Partial<ProductData>>({
    title: "Aura Noise-Canceling Headphones", 
    description: "Premium over-ear wireless headphones with adaptive active noise cancelation, 40-hour battery life, and spatial audio support.", 
    targetAudience: "Audiophiles, commuters, remote workers", 
    category: "Physical Product", 
    brand: "Aura Sound", 
    cta: "Shop Now", 
    language: "English",
    videoAspectRatio: "16:9",
    images: [],
    imageUrls: []
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof ProductData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
       const newFiles = Array.from(e.target.files);
       const newUrls = newFiles.map(f => URL.createObjectURL(f));
       setFormData(prev => ({
         ...prev,
         images: [...(prev.images || []), ...newFiles],
         imageUrls: [...(prev.imageUrls || []), ...newUrls]
       }));
    }
  };

  const handleContinue = () => {
    setState((s: any) => ({ ...s, productData: formData as ProductData }));
    onNext();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} className="flex-1 flex overflow-hidden w-full">
      
      {/* Side Workflow Rail (Mockup) */}
      <nav className="w-16 border-r border-border flex flex-col items-center py-8 space-y-8 bg-card flex-shrink-0">
        <div className="p-2 text-white"><Upload className="w-5 h-5" /></div>
        <div className="p-2 text-white/30"><Wand2 className="w-5 h-5" /></div>
        <div className="p-2 text-white/30"><Layers className="w-5 h-5" /></div>
        <div className="p-2 text-white/30"><Play className="w-5 h-5" /></div>
      </nav>

      {/* Data Column / Settings */}
      <section className="w-[400px] border-r border-border p-6 flex flex-col space-y-6 bg-card overflow-y-auto">
        <div>
          <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">New Project</label>
          <h2 className="text-2xl font-light italic font-serif text-white">Product Ingestion</h2>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-widest text-white/60">Campaign Title</Label>
            <Input className="bg-transparent border-white/10 rounded-none h-8 text-xs font-mono" placeholder="Campaign name" value={formData.title} onChange={e => handleChange('title', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-widest text-white/60">Brand Name</Label>
            <Input className="bg-transparent border-white/10 rounded-none h-8 text-xs font-mono" placeholder="Brand" value={formData.brand} onChange={e => handleChange('brand', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-widest text-white/60">Target Audience</Label>
            <Input className="bg-transparent border-white/10 rounded-none h-8 text-xs font-mono" placeholder="Audience" value={formData.targetAudience} onChange={e => handleChange('targetAudience', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-widest text-white/60">Category</Label>
            <Select value={formData.category} onValueChange={v => handleChange('category', v)}>
              <SelectTrigger className="bg-transparent border-white/10 rounded-none h-8 text-xs font-mono">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent className="bg-card border-white/10 rounded-none">
                <SelectItem value="Physical Product" className="text-xs">Physical Product</SelectItem>
                <SelectItem value="Digital Software" className="text-xs">Digital Software</SelectItem>
                <SelectItem value="Service" className="text-xs">Service</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-widest text-white/60">Video Aspect Ratio</Label>
            <Select value={formData.videoAspectRatio} onValueChange={v => handleChange('videoAspectRatio', v)}>
              <SelectTrigger className="bg-transparent border-white/10 rounded-none h-8 text-xs font-mono">
                <SelectValue placeholder="Select Ratio" />
              </SelectTrigger>
              <SelectContent className="bg-card border-white/10 rounded-none">
                <SelectItem value="16:9" className="text-xs">16:9 (Landscape)</SelectItem>
                <SelectItem value="9:16" className="text-xs">9:16 (Portrait)</SelectItem>
                <SelectItem value="1:1" className="text-xs">1:1 (Square)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 pt-4 border-t border-border">
            <Label className="text-[10px] uppercase tracking-widest text-white/60">Primary CTA</Label>
            <Input className="bg-transparent border-white/10 rounded-none h-8 text-xs font-mono" value={formData.cta} onChange={e => handleChange('cta', e.target.value)} />
          </div>
        </div>

        <div className="flex-1"></div>
        
        <Button onClick={handleContinue} className="w-full rounded-none bg-white text-black hover:bg-white/90 text-[10px] uppercase tracking-[0.2em] h-10">
          Initialize Engine <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </section>

      {/* Main Preview Area */}
      <section className="flex-1 bg-background p-8 flex flex-col overflow-y-auto">
        <div className="max-w-3xl flex-1 flex flex-col space-y-8">
           <div className="space-y-4">
              <span className="text-[10px] uppercase tracking-widest text-white/40 block">01 / Assets</span>
              <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFileChange} />
              <div 
                 onClick={() => fileInputRef.current?.click()}
                 className="h-64 border border-white/10 bg-white/5 flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 bg-white flex items-center justify-center mb-4 rounded-full group-hover:scale-110 transition-transform">
                   <Upload className="w-5 h-5 text-black" />
                </div>
                <div className="text-xs font-mono text-white tracking-widest uppercase">Select Media Directory</div>
                <div className="text-[10px] text-white/40 mt-1">Accepts PNG, JPG, RAW</div>
              </div>

              <div className="grid grid-cols-4 gap-4 mt-4">
                {(formData.imageUrls && formData.imageUrls.length > 0) ? formData.imageUrls.map((url, idx) => (
                    <div key={idx} className="aspect-square border border-white/20 bg-white/10 relative overflow-hidden group">
                       <img src={url} alt={`Asset ${idx + 1}`} className="absolute inset-0 w-full h-full object-cover mix-blend-luminosity opacity-80 group-hover:mix-blend-normal transition-all" />
                       <div className="absolute top-2 left-2 text-[8px] bg-black/80 px-1 py-0.5 border border-white/20 font-mono">ASSET_{String(idx + 1).padStart(2, '0')}</div>
                    </div>
                )) : (
                    <>
                        <div className="aspect-square border border-white/20 bg-white/10 relative overflow-hidden group">
                           <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80" alt="Product Demo" className="absolute inset-0 w-full h-full object-cover mix-blend-luminosity opacity-80 group-hover:mix-blend-normal transition-all" />
                           <div className="absolute top-2 left-2 text-[8px] bg-black/80 px-1 py-0.5 border border-white/20 font-mono">DEMO_01</div>
                        </div>
                        <div className="aspect-square border border-white/10 bg-white/5 flex items-center justify-center">
                           <span className="text-white/20"><ImageIcon className="w-6 h-6" /></span>
                        </div>
                    </>
                )}
              </div>
           </div>

           <div className="space-y-4 pt-8 border-t border-white/10">
              <span className="text-[10px] uppercase tracking-widest text-white/40 block">02 / Narrative Seed</span>
               <Textarea 
                className="bg-transparent border-white/10 rounded-none min-h-[120px] text-sm font-serif italic text-white/80 p-4 focus-visible:ring-1 focus-visible:ring-white/30 focus-visible:border-white/30" 
                placeholder="Describe the product's core essence, selling points, and target pain points..." 
                value={formData.description} 
                onChange={e => handleChange('description', e.target.value)} 
              />
           </div>
        </div>
      </section>
    </motion.div>
  );
}

function Step2Analysis({ state, setState, onNext, onPrev }: any) {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!state.strategy) {
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += Math.random() * 15;
        if (currentProgress > 95) currentProgress = 95;
        setProgress(currentProgress);
      }, 500);

      generateAdStrategy(state.productData).then(res => {
        clearInterval(interval);
        setProgress(100);
        setTimeout(() => {
          setState((s: any) => ({ ...s, strategy: res }));
          setLoading(false);
        }, 500);
      });
      return () => clearInterval(interval);
    } else {
       setLoading(false);
       setProgress(100);
    }
  }, []);

  const strat = state.strategy as AdStrategy;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} className="flex-1 flex overflow-hidden w-full">
      {/* Side Workflow Rail */}
      <nav className="w-16 border-r border-border flex flex-col items-center py-8 space-y-8 bg-card flex-shrink-0">
        <div className="p-2 text-white/30"><Upload className="w-5 h-5" /></div>
        <div className="p-2 text-white"><Wand2 className="w-5 h-5" /></div>
        <div className="p-2 text-white/30"><Layers className="w-5 h-5" /></div>
        <div className="p-2 text-white/30"><Play className="w-5 h-5" /></div>
      </nav>

      {/* Data Column */}
      <section className="w-[400px] border-r border-border flex flex-col bg-card overflow-hidden">
        <div className="p-6 border-b border-border">
            <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 block">Active Project</label>
                <span className="text-[10px] text-emerald-400 font-mono">SYS_SYNCED</span>
            </div>
            <h2 className="text-2xl font-light italic font-serif text-white">{state.productData?.title || 'Ethereal Mist Serum'}</h2>
        </div>

        {loading ? (
             <div className="flex-1 p-6 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
                <div className="text-[10px] uppercase tracking-widest text-white/60 text-center">
                    {progress < 30 ? "Extracting features..." : progress < 60 ? "Drafting narrative..." : "Composing scenes..."}
                </div>
                <Progress value={progress} className="h-1 bg-white/10 [&>div]:bg-white rounded-none w-full" />
             </div>
        ) : (
             <ScrollArea className="flex-1">
                 <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <span className="text-[10px] uppercase tracking-widest text-white/40 block">Creative Angles</span>
                        {strat?.angles?.map((angle, i) => (
                            <div key={i} className={`p-4 border ${i === 0 ? 'bg-white/10 border-white/30' : 'bg-transparent border-white/10'}`}>
                                <div className="text-xs text-white mb-2">A{i+1}: <span className="text-white/80 font-serif italic">"{angle.title}"</span></div>
                                <div className="text-[11px] text-white/50 leading-relaxed">{angle.description}</div>
                                <div className="flex flex-wrap gap-2 pt-3">
                                    <span className="text-[9px] border border-white/20 px-2 py-0.5 rounded-full">{angle.score}% FIT</span>
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>
             </ScrollArea>
        )}

        <div className="p-6 border-t border-border mt-auto flex gap-4">
            <Button onClick={onPrev} variant="outline" className="rounded-none border-white/20 text-white hover:bg-white/10 text-[10px] uppercase tracking-[0.2em] h-10 px-4">
                Back
            </Button>
            <Button onClick={onNext} disabled={loading} className="flex-1 rounded-none bg-white text-black hover:bg-white/90 text-[10px] uppercase tracking-[0.2em] h-10">
                Start Render <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
        </div>
      </section>

      {/* Preview Column */}
      <section className="flex-1 bg-background p-8 flex flex-col relative overflow-hidden">
        {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
                <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono flex items-center gap-2">
                    <div className="w-2 h-4 bg-white animate-pulse"></div> Generating Storyboard Matrix...
                </div>
            </div>
        ) : null}

        <div className="flex items-center justify-between mb-8">
           <div className="flex space-x-6 shrink-0">
             <button className="text-[10px] uppercase tracking-widest text-white border-b border-white pb-1">Video Storyboard</button>
             <button className="text-[10px] uppercase tracking-widest text-white/30 pb-1">Poster Flow</button>
           </div>
           <div className="text-[10px] font-mono text-white/40">SEQ_RENDER_01</div>
        </div>

        <ScrollArea className="flex-1 pr-4">
           {strat?.storyboard && (
               <div className="space-y-6 max-w-3xl">
                   {strat.storyboard.map((scene, i) => (
                       <div key={i} className="flex gap-6 p-6 border border-white/10 bg-white/[0.02] group hover:bg-white/[0.04] transition-colors relative">
                           <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                           <div className="w-24 shrink-0 border-r border-white/10 pr-6 space-y-2">
                               <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">SCENE_0{scene.scene}</div>
                               <div className="text-xl font-light text-white">{scene.duration}s</div>
                           </div>
                           <div className="flex-1 space-y-4">
                               <div>
                                   <span className="text-[9px] uppercase tracking-widest text-white/30 mb-1 block">Visual Direction</span>
                                   <p className="text-sm text-white/80 leading-relaxed font-serif">{scene.visual}</p>
                               </div>
                               <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                   {scene.textOverlay && (
                                       <div>
                                            <span className="text-[9px] uppercase tracking-widest text-white/30 mb-1 block">Overlay Text</span>
                                            <div className="text-xs font-mono text-emerald-400 bg-emerald-950/30 p-2 border border-emerald-900/30">"{scene.textOverlay}"</div>
                                       </div>
                                   )}
                                   {scene.voiceover && (
                                       <div>
                                            <span className="text-[9px] uppercase tracking-widest text-white/30 mb-1 block">Voiceover</span>
                                            <div className="text-xs italic text-yellow-400 bg-yellow-950/30 p-2 border border-yellow-900/30">"{scene.voiceover}"</div>
                                       </div>
                                   )}
                               </div>
                           </div>
                       </div>
                   ))}
               </div>
           )}
        </ScrollArea>
      </section>
    </motion.div>
  );
}

function Step3Generation({ state, setState, onNext }: any) {
  const [progresses, setProgresses] = useState({ posters: 0, video: 0, audio: 0 });

  useEffect(() => {
    let active = true;
    
    // Simulate some loading purely for visual feedback since generate functions are promises
    const interval = setInterval(() => {
      setProgresses(p => ({
        posters: Math.min(95, p.posters + Math.random() * 5),
        audio: Math.min(95, p.audio + Math.random() * 4),
        video: Math.min(95, p.video + Math.random() * 2), // video is purely mock
      }));
    }, 500);

    const generateAssets = async () => {
      const strat = state.strategy as AdStrategy;
      if (!strat) return;
      
      const newStrat = { ...strat };

      try {
        // Run posters and audio in parallel
        const posterPromises = strat.posters.map(poster => generatePosterImage(state.productData as ProductData, poster));
        const audioPromises = strat.voiceoverOptions ? strat.voiceoverOptions.map(opt => generateVoiceover(opt, 'Kore')) : [];
        if (audioPromises.length === 0 && strat.storyboard && strat.storyboard.length > 0) {
            // grab some voiceover scripts from storyboard if voiceoverOptions is empty
            const scripts = strat.storyboard.filter(s => !!s.voiceover).slice(0, 2).map(s => s.voiceover!);
            audioPromises.push(...scripts.map(script => generateVoiceover(script, 'Kore')));
        }
        
        const [postersRes, audioRes] = await Promise.all([
           Promise.all(posterPromises),
           Promise.all(audioPromises)
        ]);

        newStrat.posters = newStrat.posters.map((p, i) => ({
            ...p,
            generatedImageUrl: postersRes[i] || undefined
        }));

        const finalAudio: {title: string, data: string}[] = [];
        audioRes.forEach((res, i) => {
            if (res) finalAudio.push({ title: `Generated Voiceover ${i+1}`, data: res });
        });
        if (finalAudio.length > 0) newStrat.generatedAudio = finalAudio;

      } catch (e) {
          console.error("Asset generation error", e);
      }

      if (active) {
        clearInterval(interval);
        setProgresses({ posters: 100, audio: 100, video: 100 });
        
        // Save back into strategy
        setState((s: any) => ({ ...s, strategy: newStrat }));
        setTimeout(() => {
          onNext();
        }, 800);
      }
    };

    generateAssets();

    return () => {
        active = false;
        clearInterval(interval);
    };
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} className="flex-1 flex overflow-hidden w-full">
        {/* Side Workflow Rail */}
      <nav className="w-16 border-r border-border flex flex-col items-center py-8 space-y-8 bg-card flex-shrink-0">
        <div className="p-2 text-white/30"><Upload className="w-5 h-5" /></div>
        <div className="p-2 text-white/30"><Wand2 className="w-5 h-5" /></div>
        <div className="p-2 text-white"><Layers className="w-5 h-5" /></div>
        <div className="p-2 text-white/30"><Play className="w-5 h-5" /></div>
      </nav>

      {/* Main Area */}
      <section className="flex-1 bg-background p-8 flex flex-col items-center justify-center">
         <div className="max-w-md w-full space-y-12">
            <div className="text-center space-y-4">
                <Layers className="w-12 h-12 text-white/20 mx-auto mb-6" />
                <h2 className="text-3xl font-serif font-light italic text-white flex items-center justify-center gap-3">
                   Rendering Core Assets
                </h2>
                <div className="text-[10px] uppercase tracking-widest text-white/40 flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    Engine Cluster V.4 Online
                </div>
            </div>

            <div className="space-y-8">
                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] uppercase tracking-widest font-mono text-white/60">
                        <span>Compiling Static Posters</span>
                        <span>{Math.round(progresses.posters)}%</span>
                    </div>
                    <Progress value={progresses.posters} className="h-1 bg-white/10 [&>div]:bg-white rounded-none" />
                </div>
                 <div className="space-y-2">
                    <div className="flex justify-between text-[10px] uppercase tracking-widest font-mono text-white/60">
                        <span>Synthesizing Voiceover Tracks</span>
                        <span>{Math.round(progresses.audio)}%</span>
                    </div>
                    <Progress value={progresses.audio} className="h-1 bg-white/10 [&>div]:bg-white rounded-none" />
                </div>
                 <div className="space-y-2">
                    <div className="flex justify-between text-[10px] uppercase tracking-widest font-mono text-white/60">
                        <span>Timeline Compositing & EFX</span>
                        <span>{Math.round(progresses.video)}%</span>
                    </div>
                    <Progress value={progresses.video} className="h-1 bg-white/10 [&>div]:bg-white rounded-none" />
                </div>
            </div>
         </div>
      </section>
    </motion.div>
  );
}

function Step4Review({ state }: any) {
  const strat = state.strategy as AdStrategy;

  const handleDownloadSequence = () => {
     const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(strat, null, 2));
     const downloadAnchorNode = document.createElement('a');
     downloadAnchorNode.setAttribute("href", dataStr);
     downloadAnchorNode.setAttribute("download", "ad-create-sequence.json");
     document.body.appendChild(downloadAnchorNode);
     downloadAnchorNode.click();
     downloadAnchorNode.remove();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} className="flex-1 flex overflow-hidden w-full">
        {/* Side Workflow Rail */}
      <nav className="w-16 border-r border-border flex flex-col items-center py-8 space-y-8 bg-card flex-shrink-0">
        <div className="p-2 text-white/30"><Upload className="w-5 h-5" /></div>
        <div className="p-2 text-white/30"><Wand2 className="w-5 h-5" /></div>
        <div className="p-2 text-white/30"><Layers className="w-5 h-5" /></div>
        <div className="p-2 text-white"><Play className="w-5 h-5" /></div>
      </nav>

      {/* Main Preview Area */}
      <section className="flex-1 bg-background p-8 flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
           <div className="flex space-x-6 shrink-0">
             <button className="text-[10px] uppercase tracking-widest text-white border-b border-white pb-1">Master Output</button>
           </div>
           <button onClick={handleDownloadSequence} className="px-4 py-1.5 border border-white/20 text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-colors flex items-center gap-2">
              <Download className="w-3 h-3" /> Download Sequence
           </button>
        </div>

       <Tabs defaultValue="video" className="w-full space-y-8">
        <TabsList className="bg-transparent border-b border-border h-auto p-0 flex justify-start rounded-none w-full gap-8">
          <TabsTrigger value="video" className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b data-[state=active]:border-white rounded-none pb-2 text-[10px] uppercase tracking-widest text-white/40">
             01 / Final Video
          </TabsTrigger>
          <TabsTrigger value="posters" className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b data-[state=active]:border-white rounded-none pb-2 text-[10px] uppercase tracking-widest text-white/40">
             02 / Static Assets
          </TabsTrigger>
          <TabsTrigger value="audio" className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b data-[state=active]:border-white rounded-none pb-2 text-[10px] uppercase tracking-widest text-white/40">
             03 / Audio Masters
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="video" className="flex flex-col flex-1 h-[600px]">
           <div className="grid lg:grid-cols-[2fr_1fr] gap-6 flex-1 h-full">
             <div className="flex flex-col gap-4 h-full items-center justify-center bg-black/20">
                <div className={`border border-white/10 bg-[#111] relative overflow-hidden flex items-center justify-center group cursor-pointer hover:border-white/30 transition-colors
                  ${state.productData?.videoAspectRatio === '9:16' ? 'h-full aspect-[9/16]' : 
                    state.productData?.videoAspectRatio === '1:1' ? 'h-full aspect-square' : 'w-full aspect-video'}`}>
                   {/* Fake video player using a nice unsplash image with a play overlay */}
                   <img src="https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=1200&q=80" alt="Video Cover" className="absolute inset-0 w-full h-full object-cover mix-blend-luminosity opacity-40 group-hover:mix-blend-normal transition-all" />
                   
                   <div className="text-[10px] uppercase tracking-[0.4em] text-white/80 absolute top-8 left-8">Lumina Smart Lamp</div>
                   <div className="text-4xl font-serif font-light text-white italic absolute bottom-1/3 left-8 z-20">See The Light</div>

                   <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                   
                   <div className="w-16 h-16 rounded-full border border-white/20 bg-black/40 backdrop-blur flex items-center justify-center group-hover:scale-110 group-active:scale-95 transition-transform z-10 hover:border-white">
                      <Play className="w-5 h-5 text-white ml-0.5" />
                   </div>

                   <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-black/40 backdrop-blur z-20 flex items-center gap-4">
                      <Button size="icon" variant="ghost" className="text-white hover:bg-white/10 rounded-none w-8 h-8"><Play className="w-3 h-3" /></Button>
                      <div className="flex-1 h-1 bg-white/10 relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-white" />
                      </div>
                      <span className="text-[10px] font-mono text-white/40">0:10<span className="mx-1">/</span>0:30</span>
                      <Button size="icon" variant="ghost" className="text-white hover:bg-white/10 rounded-none w-8 h-8"><Maximize2 className="w-3 h-3" /></Button>
                   </div>
                </div>
             </div>

             <div className="bg-card border border-border h-full flex flex-col">
               <div className="p-4 border-b border-border">
                 <h3 className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Export Config</h3>
                 <div className="text-sm">MP4 / 4K / 30FPS / {state.productData?.videoAspectRatio || '16:9'}</div>
               </div>
               <ScrollArea className="flex-1 p-0">
                  <div className="p-4 space-y-4">
                     {strat?.storyboard.map((scene, i) => (
                       <div key={i} className="pl-4 border-l border-white/10 relative pb-4">
                          <div className="absolute left-[-2.5px] top-1 w-[4px] h-[4px] bg-white ring-4 ring-black" />
                          <div className="text-[9px] uppercase tracking-widest text-white/40 mb-2 font-mono">0:{(i * 5).toString().padStart(2, '0')} — S{scene.scene}</div>
                          <p className="text-sm text-white/70 mb-2 font-serif">{scene.visual}</p>
                          {scene.voiceover && <p className="text-[10px] text-white/50 bg-white/5 p-2 italic">"{scene.voiceover}"</p>}
                       </div>
                     ))}
                  </div>
               </ScrollArea>
             </div>
           </div>
        </TabsContent>

        <TabsContent value="posters" className="mt-0">
           <div className="grid md:grid-cols-3 gap-6">
              {strat?.posters.map((poster, i) => {
                 const dummyImg = i === 0 ? "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80" 
                                : i === 1 ? "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80"
                                : "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80";
                 
                 const ratioClass = poster.format.includes('9:16') ? 'aspect-[9/16]' : poster.format.includes('16:9') ? 'aspect-video' : 'aspect-square';

                 return (
                  <div key={i} className="border border-white/10 bg-[#111] overflow-hidden group relative flex flex-col">
                     <div className={`w-full ${ratioClass} relative bg-[#050505] flex-shrink-0`}>
                        <img src={poster.generatedImageUrl || dummyImg} alt={poster.headline} className="absolute inset-0 w-full h-full object-cover mix-blend-luminosity opacity-50 group-hover:mix-blend-normal transition-all" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/40" />
                        
                        <div className="absolute top-6 left-6 right-6">
                           <div className="text-[8px] uppercase tracking-[0.4em] text-white/80 mb-2">{poster.subheadline.substring(0, 30)}</div>
                           <h2 className="text-2xl font-serif font-light text-white italic leading-tight">{poster.headline}</h2>
                        </div>
                        
                        <div className="absolute bottom-6 right-6 text-right">
                           <span className="border border-white/20 text-white text-[9px] uppercase tracking-widest px-3 py-1.5">{poster.cta}</span>
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm z-30">
                           <Button variant="outline" className="rounded-none border-white/20 text-[10px] uppercase tracking-widest h-8"><Eye className="w-3 h-3 mr-2" /> View</Button>
                           <Button 
                             onClick={() => {
                               const a = document.createElement('a');
                               a.href = poster.generatedImageUrl || dummyImg;
                               a.download = `poster-${i+1}.jpg`;
                               a.target = '_blank';
                               a.click();
                             }}
                             variant="outline" className="rounded-none border-white/20 text-[10px] uppercase tracking-widest h-8"><Download className="w-3 h-3 mr-2" /> DL</Button>
                        </div>
                     </div>
                     <div className="p-4 border-t border-white/10 flex justify-between items-center bg-black auto">
                        <span className="text-[10px] text-white/60 font-mono">{poster.format}</span>
                        <span className="text-[10px] uppercase tracking-widest text-white/40">{poster.style}</span>
                     </div>
                  </div>
                 );
              })}
           </div>
        </TabsContent>

        <TabsContent value="audio" className="mt-0">
          <div className="bg-card border border-border">
             <div className="p-4 border-b border-border">
               <h3 className="text-[10px] uppercase tracking-widest text-white mt-1">Audio Masters</h3>
             </div>
             <div className="space-y-0">
               {(strat.generatedAudio && strat.generatedAudio.length > 0 ? strat.generatedAudio : [
                 { title: "Energetic Promo Voiceover (Female)", duration: "0:28", icon: Mic, active: true },
                 { title: "Deep Cinematic Trailer (Male)", duration: "0:30", icon: Mic, active: false },
                 { title: "Background Music - Corporate Tech", duration: "1:45", icon: Music, active: false }
               ]).map((track: any, i: number) => (
                  <div key={i} className={`p-4 border-b border-white/5 flex items-center gap-4 transition-colors ${track.active ? 'bg-white/5' : 'bg-transparent hover:bg-white/[0.02]'}`}>
                     <Button 
                       onClick={() => {
                         if (track.data) {
                            const audio = new Audio(track.data);
                            audio.play();
                         }
                       }}
                       size="icon" variant="outline" className={`rounded-none h-8 w-8 border-white/20 ${track.active ? 'bg-white text-black hover:bg-white/90' : 'text-white/60 hover:text-white hover:bg-white/10'}`}>
                       <Play className="w-3 h-3 ml-0.5" />
                     </Button>
                     <div className="flex-1">
                        <h4 className="text-[11px] uppercase tracking-wider text-white/80">{track.title}</h4>
                        <div className="w-full h-[1px] bg-white/10 mt-3 relative">
                           <div className={`absolute left-0 top-0 bottom-0 ${track.active ? 'bg-emerald-500 w-1/3' : 'bg-white/30 w-0'}`} />
                        </div>
                     </div>
                     <div className="text-[10px] font-mono text-white/40 min-w-[40px] text-right">{track.duration || "0:30"}</div>
                     <Button 
                        onClick={() => {
                           const a = document.createElement('a');
                           a.href = track.data || "data:text/plain;charset=utf-8,Mock_Audio_Content";
                           a.download = `${track.title.replace(/\s+/g, '_')}.mp3`;
                           a.click();
                        }}
                        size="icon" variant="ghost" className="text-white/40 hover:text-white rounded-none h-8 w-8"><Download className="w-3 h-3" /></Button>
                  </div>
               ))}
             </div>
          </div>
        </TabsContent>
       </Tabs>
      </section>
    </motion.div>
  );
}

