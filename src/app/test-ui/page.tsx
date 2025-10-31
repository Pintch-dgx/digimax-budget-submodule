"use client";

import { useState } from "react";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, Modal, Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui";

export default function TestUIPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputError = "Questo campo è obbligatorio";

  return (
    <div className="min-h-screen bg-slate-50 p-8 dark:bg-slate-950">
      <div className="mx-auto max-w-4xl space-y-8">
        <h1 className="text-3xl font-bold">UI Kit Test Page</h1>

        {/* Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>Varianti e dimensioni</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button variant="primary" size="sm">Primary Small</Button>
            <Button variant="primary" size="md">Primary Medium</Button>
            <Button variant="primary" size="lg">Primary Large</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button disabled>Disabled</Button>
          </CardContent>
        </Card>

        {/* Inputs */}
        <Card>
          <CardHeader>
            <CardTitle>Inputs</CardTitle>
            <CardDescription>Campi form con validazione</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Input normale" value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
            <Input placeholder="Email" type="email" />
            <Input placeholder="Password" type="password" />
            <Input placeholder="Input con errore" error={inputError || "Questo campo è obbligatorio"} />
          </CardContent>
        </Card>

        {/* Modal */}
        <Card>
          <CardHeader>
            <CardTitle>Modal</CardTitle>
            <CardDescription>Dialog e overlay</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setModalOpen(true)}>Apri Modal</Button>
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Test Modal" size="md">
              <p className="mb-4">Questo è un modal di test. Puoi chiuderlo cliccando fuori o sul pulsante X.</p>
              <Button onClick={() => setModalOpen(false)}>Chiudi</Button>
            </Modal>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Table</CardTitle>
            <CardDescription>Tabelle dati</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campagna</TableHead>
                  <TableHead>Canale</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Brand Refresh Q3</TableCell>
                  <TableCell>Digital</TableCell>
                  <TableCell className="text-right">€320.000</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Evento Clienti Milano</TableCell>
                  <TableCell>Events</TableCell>
                  <TableCell className="text-right">€210.000</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Card Base</CardTitle>
              <CardDescription>Descrizione card</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Contenuto della card</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Card Con Azioni</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>Contenuto con azioni</p>
              <div className="flex gap-2">
                <Button size="sm">Azione 1</Button>
                <Button size="sm" variant="outline">Azione 2</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

