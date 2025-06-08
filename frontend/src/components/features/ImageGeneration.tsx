import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Image, Upload, Download, Copy } from 'lucide-react';

const imageModels = [
  { id: 'sd-xl', name: 'Stable Diffusion XL', provider: 'stability' },
  { id: 'sd-3', name: 'Stable Diffusion 3', provider: 'stability' },
  { id: 'dalle-3', name: 'DALL-E 3', provider: 'openai' },
  { id: 'midjourney', name: 'Midjourney', provider: 'midjourney' },
];

const aspectRatios = [
  { id: '1:1', name: 'Square (1:1)', value: '1024x1024' },
  { id: '16:9', name: 'Landscape (16:9)', value: '1344x768' },
  { id: '9:16', name: 'Portrait (9:16)', value: '768x1344' },
  { id: '4:3', name: 'Classic (4:3)', value: '1152x896' },
];

export function ImageGeneration() {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState(imageModels[0].id);
  const [aspectRatio, setAspectRatio] = useState(aspectRatios[0].id);
  const [steps, setSteps] = useState(25);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  const handleTextToImage = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      // TODO: Call your backend API for image generation
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/images/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await import('@/lib/supabase').then(m => m.supabase.auth.getSession())).data.session?.access_token}`,
        },
        body: JSON.stringify({
          prompt,
          negativePrompt,
          model: selectedModel,
          aspectRatio: aspectRatios.find(ar => ar.id === aspectRatio)?.value,
          steps,
          count: 4,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate images');
      }

      const data = await response.json();
      setGeneratedImages(data.images || []);
    } catch (error) {
      console.error('Error generating images:', error);
      // TODO: Show error toast
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageToImage = async (file: File) => {
    setIsGenerating(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('prompt', prompt);
      formData.append('model', selectedModel);
      formData.append('steps', steps.toString());

      // TODO: Call your backend API for image-to-image generation
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/images/transform`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await import('@/lib/supabase').then(m => m.supabase.auth.getSession())).data.session?.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to transform image');
      }

      const data = await response.json();
      setGeneratedImages(data.images || []);
    } catch (error) {
      console.error('Error transforming image:', error);
      // TODO: Show error toast
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Sparkles className="w-4 h-4" />
          Generate Image
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            AI Image Generation
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="text-to-image" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text-to-image">Text to Image</TabsTrigger>
            <TabsTrigger value="image-to-image">Image to Image</TabsTrigger>
          </TabsList>

          <TabsContent value="text-to-image" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt">Prompt</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Describe the image you want to generate..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="negative-prompt">Negative Prompt (Optional)</Label>
                  <Textarea
                    id="negative-prompt"
                    placeholder="What you don't want in the image..."
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {imageModels.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            <div className="flex flex-col">
                              <span>{model.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {model.provider}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Aspect Ratio</Label>
                    <Select value={aspectRatio} onValueChange={setAspectRatio}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {aspectRatios.map((ratio) => (
                          <SelectItem key={ratio.id} value={ratio.id}>
                            {ratio.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Steps: {steps}</Label>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    value={steps}
                    onChange={(e) => setSteps(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <Button
                  onClick={handleTextToImage}
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Images
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Generated Images</h3>
                {generatedImages.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {generatedImages.map((image, index) => (
                      <Card key={index} className="overflow-hidden">
                        <CardContent className="p-0">
                          <img
                            src={image}
                            alt={`Generated ${index + 1}`}
                            className="w-full h-32 object-cover"
                          />
                          <div className="p-2 flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2"
                              onClick={() => window.open(image, '_blank')}
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2"
                              onClick={() => navigator.clipboard.writeText(image)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <Image className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Generated images will appear here
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="image-to-image" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Upload Image</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Drag and drop or click to upload
                    </p>
                    <Button variant="outline" size="sm">
                      Choose File
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transform-prompt">Transformation Prompt</Label>
                  <Textarea
                    id="transform-prompt"
                    placeholder="How should the image be transformed?"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                <Button
                  disabled={isGenerating}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Transforming...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Transform Image
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Transformed Images</h3>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <Image className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Transformed images will appear here
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}